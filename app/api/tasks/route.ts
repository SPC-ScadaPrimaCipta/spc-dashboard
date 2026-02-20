import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
	requireUserId,
	handleApiError,
	buildAuditDiff,
} from "@/lib/task-utils";
import { TaskCreateSchema } from "@/lib/task-validators";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const userId = await requireUserId();

		const fromParam = searchParams.get("from");
		const toParam = searchParams.get("to");
		const assigneeId = searchParams.get("assigneeId");
		const statusId = searchParams.get("statusId");
		const labelSlug = searchParams.get("label");

		// Default range if not provided: -7 to +7 days
		const now = new Date();
		const from = fromParam
			? new Date(fromParam)
			: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const to = toParam
			? new Date(toParam)
			: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

		const where: any = {
			// Overlap logic: startAt < to AND (endAt > from OR endAt is null)
			// Actually simpler:
			// If we want tasks visible in [from, to):
			//  Task starts before 'to' AND (Task ends after 'from' OR Task has no end)
			AND: [
				{
					startAt: {
						lt: to,
					},
				},
				{
					OR: [{ endAt: { gt: from } }, { endAt: null }],
				},
			],
		};

		if (assigneeId) {
			where.assignments = {
				some: { assigneeId },
			};
		}

		if (statusId) {
			where.statusId = statusId;
		}

		if (labelSlug) {
			where.labels = {
				some: {
					label: {
						slug: labelSlug,
					},
				},
			};
		}

		const tasks = await prisma.task.findMany({
			where,
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
				_count: {
					select: { comments: true },
				},
			},
			orderBy: { startAt: "asc" },
		});

		// Flatten for response convenience if needed, but keeping as is per requirements
		return NextResponse.json({ ok: true, data: tasks });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		const userId = await requireUserId();
		const json = await req.json();
		const body = TaskCreateSchema.parse(json);

		// 0. Handle New Labels first (if any)
		const newPendingLabels = json.newPendingLabels;
		if (Array.isArray(newPendingLabels) && newPendingLabels.length > 0) {
			await Promise.all(
				newPendingLabels.map(async (label: any) => {
					// Upsert logic: if slug exists, do nothing (or update?), if not create.
					// We just want to ensure it exists.
					try {
						await prisma.label.upsert({
							where: { slug: label.slug },
							update: {}, // No update if exists
							create: {
								slug: label.slug,
								name: label.name,
								color: label.color,
								createdById: userId,
							},
						});
					} catch (e) {
						// Ignore unique constraint race conditions
						console.error("Label upsert error", e);
					}
				}),
			);

			// Ensure these new slugs are in the body.labelSlugs list for linking
			if (!body.labelSlugs) body.labelSlugs = [];
			const innovativeSlugs = newPendingLabels.map((l: any) => l.slug);
			// Merge uniquely
			body.labelSlugs = Array.from(
				new Set([...body.labelSlugs, ...innovativeSlugs]),
			);
		}

		// Validation for Labels (Re-check all slugs now)
		if (body.labelSlugs && body.labelSlugs.length > 0) {
			const existingLabels = await prisma.label.findMany({
				where: { slug: { in: body.labelSlugs } },
			});
			const foundSlugs = new Set(existingLabels.map((l: any) => l.slug));
			const missingSlugs = body.labelSlugs.filter(
				(s) => !foundSlugs.has(s),
			);

			// If we just created them, they should be found. If not, something failed.
			if (missingSlugs.length > 0) {
				// Should we error or just ignore? User requested explicit flow.
				return NextResponse.json(
					{
						ok: false,
						error: `Labels not found (failed to create?): ${missingSlugs.join(", ")}`,
					},
					{ status: 400 },
				);
			}
		}

		// Time Logic
		let { startAt, endAt, durationMin } = body;
		let computedStartAt = startAt ? new Date(startAt) : null;
		let computedEndAt = endAt ? new Date(endAt) : null;
		let computedDurationMin = durationMin;

		if (computedStartAt && computedEndAt) {
			// Recompute duration
			const diffMs = computedEndAt.getTime() - computedStartAt.getTime();
			computedDurationMin = Math.round(diffMs / 60000);
		} else if (computedStartAt && computedDurationMin && !computedEndAt) {
			// Compute endAt
			computedEndAt = new Date(
				computedStartAt.getTime() + computedDurationMin * 60000,
			);
		}

		if (body.allDay) {
			// logic: start/end define the day range. if endAt missing, implies single day?
			// user prompt allows keeping inconsistent if allDay=true, but encourages consistency.
			// we will trust computed values.
		}

		// Transaction
		const result = await prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				// 1. Create Task
				const task = await tx.task.create({
					data: {
						title: body.title,
						description: body.description,
						type: body.type || "TASK",
						priority: body.priority || "MEDIUM",
						statusId: body.statusId,
						startAt: computedStartAt,
						endAt: computedEndAt,
						durationMin: computedDurationMin,
						allDay: body.allDay ?? false,
						timezone: body.timezone,
						color: body.color,
						createdById: userId,
					},
				});

				// 2. Attachments (Assignments & Labels)
				if (body.assigneeIds && body.assigneeIds.length > 0) {
					await tx.taskAssignment.createMany({
						data: body.assigneeIds.map((assigneeId) => ({
							taskId: task.id,
							assigneeId,
							assignedById: userId,
						})),
					});
				}

				if (body.labelSlugs && body.labelSlugs.length > 0) {
					// Resolve IDs first
					const labels = await tx.label.findMany({
						where: { slug: { in: body.labelSlugs } },
						select: { id: true },
					});
					await tx.taskLabel.createMany({
						data: labels.map((l: any) => ({
							taskId: task.id,
							labelId: l.id,
							assignedById: userId,
						})),
					});
				}

				if (body.resourceId) {
					await tx.taskResource.create({
						data: {
							taskId: task.id,
							resourceId: body.resourceId,
						},
					});
				}

				// 3. Audit
				// Prepare "data" snapshot
				// We can't fetch the full task with includes inside the create call easily without a secondary read,
				// but we have the inputs.
				// Let's store the input body as the snapshot or the created task fields.
				const snapshot = {
					...task,
					assigneeIds: body.assigneeIds,
					labelSlugs: body.labelSlugs,
				};

				await tx.taskAuditTrail.create({
					data: {
						taskId: task.id,
						action: "CREATE",
						byUserId: userId,
						data: snapshot as any,
						message: "Task created",
					},
				});

				return task;
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
