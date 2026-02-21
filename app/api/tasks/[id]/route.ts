import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
	requireUserId,
	handleApiError,
	buildAuditDiff,
} from "@/lib/task-utils";
import { TaskUpdateSchema } from "@/lib/task-validators";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const { id } = await params;

		const task = await prisma.task.findUnique({
			where: { id },
			include: {
				status: true,
				assignments: {
					include: {
						assignee: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true,
							},
						},
					},
				},
				labels: {
					include: {
						label: true,
					},
				},
				resources: {
					include: {
						resource: {
							include: {
								resourceType: true,
							},
						},
					},
				},
			},
		});

		if (!task) {
			return NextResponse.json(
				{ ok: false, error: "Task not found" },
				{ status: 404 },
			);
		}

		// Fetch comments
		const comments = await prisma.taskComment.findMany({
			where: { taskId: id },
			take: 10,
			orderBy: { createdAt: "desc" },
		});

		// Fetch audit
		const audits = await prisma.taskAuditTrail.findMany({
			where: { taskId: id },
			take: 10,
			orderBy: { at: "desc" },
		});

		// Resolve Users
		const userIds = new Set<string>();
		comments.forEach((c: any) => userIds.add(c.createdById));
		audits.forEach((a: any) => {
			if (a.byUserId) userIds.add(a.byUserId);
		});

		const users = (await prisma.user.findMany({
			where: { id: { in: Array.from(userIds) } },
			select: { id: true, name: true, image: true },
		})) as any[];
		const userMap = new Map(users.map((u) => [u.id, u]));

		const enrichedTask = {
			...task,
			comments: comments.map((c: any) => ({
				...c,
				author:
					userMap.get(c.createdById) ||
					({ name: "Unknown", image: null } as any),
			})),
			auditTrail: audits.map((a: any) => ({
				...a,
				byUser: a.byUserId
					? userMap.get(a.byUserId) ||
						({ name: "Unknown", image: null } as any)
					: null,
			})),
		};

		return NextResponse.json({ ok: true, data: enrichedTask });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const { id } = await params;
		const json = await req.json();
		const body = TaskUpdateSchema.parse(json);

		const oldTask = await prisma.task.findUnique({
			where: { id },
			include: {
				assignments: { select: { assigneeId: true } },
				labels: { include: { label: true } },
			},
		});

		if (!oldTask) {
			return NextResponse.json(
				{ ok: false, error: "Task not found" },
				{ status: 404 },
			);
		}

		// --- Labels Logic ---
		let labelsToCreate: string[] = [];
		let labelsToDelete: string[] = [];
		let newLabelIds: string[] = [];

		if (body.labelSlugs) {
			const currentSlugs = oldTask.labels.map((l: any) => l.label.slug);
			const newSlugs = body.labelSlugs;

			const toAdd = newSlugs.filter((s) => !currentSlugs.includes(s));
			const toRemove = currentSlugs.filter(
				(s: string) => !newSlugs.includes(s),
			);

			if (toAdd.length > 0) {
				const labels = await prisma.label.findMany({
					where: { slug: { in: toAdd } },
					select: { id: true, slug: true },
				});
				// Validate existence
				const foundSlugs = labels.map((l: any) => l.slug);
				const missing = toAdd.filter((s) => !foundSlugs.includes(s));
				if (missing.length > 0) {
					return NextResponse.json(
						{
							ok: false,
							error: `Labels not found: ${missing.join(", ")}`,
						},
						{ status: 400 },
					);
				}
				newLabelIds = labels.map((l: any) => l.id);
				labelsToCreate = newLabelIds;
			}

			// To delete, we need labelIds.
			// We can get them from oldTask.labels
			labelsToDelete = oldTask.labels
				.filter((l: any) => toRemove.includes(l.label.slug))
				.map((l: any) => l.labelId);
		}

		// --- Assignees Logic ---
		let assigneesToAdd: string[] = [];
		let assigneesToRemove: string[] = [];

		if (body.assigneeIds) {
			const currentIds = oldTask.assignments.map(
				(a: any) => a.assigneeId,
			);
			assigneesToAdd = body.assigneeIds.filter(
				(id) => !currentIds.includes(id),
			);
			assigneesToRemove = currentIds.filter(
				(id: string) => !body.assigneeIds!.includes(id),
			);
		}

		// --- Derived Time Logic ---
		let updates: any = { ...body };
		// Remove relation fields from scalar updates
		delete updates.assigneeIds;
		delete updates.labelSlugs;
		delete updates.resourceId;

		// Recalculate duration/endAt if time fields change
		const mergedStart =
			body.startAt !== undefined
				? body.startAt
					? new Date(body.startAt)
					: null
				: oldTask.startAt;
		const mergedEnd =
			body.endAt !== undefined
				? body.endAt
					? new Date(body.endAt)
					: null
				: oldTask.endAt;
		let mergedDuration =
			body.durationMin !== undefined
				? body.durationMin
				: oldTask.durationMin;

		if (mergedStart && mergedEnd) {
			const diffMs = mergedEnd.getTime() - mergedStart.getTime();
			updates.durationMin = Math.round(diffMs / 60000);
			updates.startAt = mergedStart;
			updates.endAt = mergedEnd;
		} else if (mergedStart && mergedDuration && !mergedEnd) {
			updates.endAt = new Date(
				mergedStart.getTime() + mergedDuration * 60000,
			);
			updates.startAt = mergedStart;
			updates.durationMin = mergedDuration;
		}
		// If user explicitly sent nulls, they are respected by the updates object already (except the logic above might override them if consistent).

		// --- Diffing for Update Audit ---
		// We only diff the scalar fields on Task
		// Need to exclude relations from oldTask for clean diff
		const { assignments, labels, ...serverOldTask } = oldTask;
		const diff = buildAuditDiff(serverOldTask, {
			...serverOldTask,
			...updates,
		});

		// --- Transaction ---
		const result = await prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				// 1. Update Task
				const updatedTask = await tx.task.update({
					where: { id },
					data: {
						...updates,
						updatedById: userId,
					},
				});

				// 2. Update Assignees
				if (assigneesToRemove.length > 0) {
					await tx.taskAssignment.deleteMany({
						where: {
							taskId: id,
							assigneeId: { in: assigneesToRemove },
						},
					});
					await tx.taskAuditTrail.create({
						data: {
							taskId: id,
							action: "UNASSIGN",
							byUserId: userId,
							data: { removedIds: assigneesToRemove },
							message: "Assignees removed",
						},
					});
				}
				if (assigneesToAdd.length > 0) {
					await tx.taskAssignment.createMany({
						data: assigneesToAdd.map((uid) => ({
							taskId: id,
							assigneeId: uid,
							assignedById: userId,
						})),
					});
					await tx.taskAuditTrail.create({
						data: {
							taskId: id,
							action: "ASSIGN",
							byUserId: userId,
							data: { addedIds: assigneesToAdd },
							message: "Assignees added",
						},
					});

					// Keep TaskResource in sync with assignees (auto-create ScheduleResource if missing)
					const peopleType = await tx.resourceType.findUnique({
						where: { code: "PEOPLE" },
					});

					if (peopleType) {
						for (const uid of assigneesToAdd) {
							let resource = await tx.scheduleResource.findFirst({
								where: {
									userId: uid,
									resourceTypeId: peopleType.id,
								},
							});

							if (!resource) {
								const user = await tx.user.findUnique({
									where: { id: uid },
								});
								if (user) {
									resource = await tx.scheduleResource.create(
										{
											data: {
												name: user.name,
												resourceTypeId: peopleType.id,
												userId: uid,
												isActive: true,
												createdById: userId,
												updatedById: userId,
											},
										},
									);
								}
							}

							if (resource) {
								const existingLink =
									await tx.taskResource.findUnique({
										where: {
											taskId_resourceId: {
												taskId: id,
												resourceId: resource.id,
											},
										},
									});
								if (!existingLink) {
									await tx.taskResource.create({
										data: {
											taskId: id,
											resourceId: resource.id,
											assignedById: userId,
										},
									});
								}
							}
						}
					}
				}

				// 3. Update Labels
				if (labelsToDelete.length > 0) {
					await tx.taskLabel.deleteMany({
						where: {
							taskId: id,
							labelId: { in: labelsToDelete },
						},
					});
				}
				if (labelsToCreate.length > 0) {
					await tx.taskLabel.createMany({
						data: labelsToCreate.map((lid) => ({
							taskId: id,
							labelId: lid,
							assignedById: userId,
						})),
					});
				}

				// 3b. Update Resource
				if (body.resourceId) {
					await tx.taskResource.deleteMany({
						where: { taskId: id },
					});
					await tx.taskResource.create({
						data: {
							taskId: id,
							resourceId: body.resourceId,
						},
					});
				}
				// Log label changes as part of general update or separate?
				// "comment create/label changes... create TaskAuditTrail row"
				// Let's add specific audit if labels changed
				if (labelsToDelete.length > 0 || labelsToCreate.length > 0) {
					// Create a synthetic Update action or specific message?
					// Requirement: "CREATE, UPDATE, STATUS_CHANGE, ASSIGN, UNASSIGN, COMMENT, DELETE."
					// So use UPDATE with label diff.
					// We can merge this into the main UPDATE diff if strict is not required,
					// OR create a separate entry. A separate entry is cleaner if "diff" variable is null otherwise.
					// But usually we want one UPDATE entry per request.
					// I'll append label changes to `diff` if possible, or create separate if `diff` is null.
				}

				// 4. Status Change Audit
				if (body.statusId && body.statusId !== oldTask.statusId) {
					await tx.taskAuditTrail.create({
						data: {
							taskId: id,
							action: "STATUS_CHANGE",
							byUserId: userId,
							data: { from: oldTask.statusId, to: body.statusId },
							message: "Status changed",
						},
					});
				}

				// 5. Main Update Audit (Title, Desc, Time, Color, Labels)
				// I'll add labels to the diff manually if they changed
				let finalDiff: any = diff || {};
				if (body.labelSlugs) {
					const currentSlugs = oldTask.labels.map(
						(l: any) => l.label.slug,
					);
					const newSlugs = body.labelSlugs;
					if (
						JSON.stringify(currentSlugs.sort()) !==
						JSON.stringify(newSlugs.sort())
					) {
						finalDiff.labels = { from: currentSlugs, to: newSlugs };
					}
				}

				// If we have any updates to task fields (including labels)
				if (Object.keys(finalDiff).length > 0) {
					// Filter out statusId from finalDiff if we already logged it separately?
					// Requirement says "STATUS_CHANGE when statusId changes".
					// So yes, remove statusId from "UPDATE" diff to avoid redundancy.
					delete finalDiff.statusId;
					delete finalDiff.updatedById; // metadata
					delete finalDiff.updatedAt;

					if (Object.keys(finalDiff).length > 0) {
						await tx.taskAuditTrail.create({
							data: {
								taskId: id,
								action: "UPDATE",
								byUserId: userId,
								data: finalDiff,
								message: "Task updated",
							},
						});
					}
				}

				return updatedTask;
			},
		);

		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ ok: false, error: error.flatten() },
				{ status: 400 },
			);
		}
		return handleApiError(error);
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const { id } = await params;

		// Write audit before delete?
		// "Write audit action=DELETE before deletion."
		// But if we delete the task, cascade deletes the audit trail?
		// Checks schema:
		// TaskAuditTrail: `task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)`
		// So yes, the audit log will be deleted when task is deleted.
		// This makes "Audit Trail" useless for Deleted tasks unless we keep it or soft-delete.
		// The requirement says "Delete task (cascade will remove assignments/labels/comments/audits if set)".
		// So the user accepts that history is gone?
		// "Write audit action=DELETE before deletion." -> This implies maybe they have a separate audit log or just want the event fired.
		// If I write it, it gets deleted immediately.
		// Unless I set `onDelete: SetNull`?
		// Schema says: `onDelete: Cascade`.
		// So... I will follow instructions: "Write audit action=DELETE before deletion."
		// Maybe they are streaming logs or using triggers? Or maybe they didn't realize.
		// Implementation:

		await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			// Create audit (it will die immediately, but complies with request)
			await tx.taskAuditTrail.create({
				data: {
					taskId: id,
					action: "DELETE",
					byUserId: userId,
					message: "Task deleted",
				},
			});

			await tx.task.delete({
				where: { id },
			});
		});

		return NextResponse.json({ ok: true, data: { id } });
	} catch (error) {
		return handleApiError(error);
	}
}
