import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
	requireUserId,
	handleApiError,
	hasScopedPermission,
} from "@/lib/task-utils";
import { hasPermission } from "@/lib/rbac";
import { headers } from "next/headers";

export async function GET(req: Request) {
	try {
		const userId = await requireUserId();
		const { searchParams } = new URL(req.url);

		const startParam = searchParams.get("start");
		const endParam = searchParams.get("end");
		const resourceTypeCode = searchParams.get("type");
		const divisionParams = searchParams.getAll("division");
		const divisions = divisionParams
			.flatMap((d) => d.split(","))
			.filter(Boolean);
		const locationCategory = searchParams.get("loc");

		const startDate = startParam ? new Date(startParam) : null;
		const endDate = endParam ? new Date(endParam) : null;
		const isValidRange =
			startDate &&
			endDate &&
			!isNaN(startDate.getTime()) &&
			!isNaN(endDate.getTime());

		const canChangeResource = await hasPermission("manage", "schedules");

		if (resourceTypeCode === "TASK") {
			const taskWhere: any = {
				status: { isActive: true },
			};

			if (locationCategory) {
				taskWhere.location = {
					category: locationCategory,
				};
			}

			if (isValidRange) {
				taskWhere.AND = [
					{ startAt: { lte: endDate } },
					{ endAt: { gte: startDate } },
				];
			}

			// In this view, we want to see People on the Task rows
			// Rows are tasks, Events are people (found in TaskResource)
			const tasks = await prisma.task.findMany({
				where: taskWhere,
				include: {
					resources: {
						include: {
							resource: {
								include: {
									resourceType: true,
									user: {
										include: {
											profile: true,
										},
									},
								},
							},
						},
					},
				},
			});

			const events: any[] = [];
			tasks.forEach((task) => {
				const rowResourceId = task.code || task.id;
				// Filter for resources that are PEOPLE
				const peopleResources = task.resources.filter(
					(tr) => tr.resource.resourceType.code === "PEOPLE",
				);

				// Collect all resource types for this task
				const allResourceTypes = task.resources.map(
					(tr) => tr.resource.resourceType.code,
				);

				peopleResources.forEach((tr) => {
					// Get initials from profile or calculate from name
					let initials = tr.resource.user?.profile?.initials;
					if (!initials && tr.resource.name) {
						initials = tr.resource.name
							.split(" ")
							.filter(Boolean)
							.map((n: string) => n.charAt(0))
							.join("")
							.toUpperCase()
							.substring(0, 3);
					}

					events.push({
						id: `${task.id}_${tr.resourceId}`,
						taskId: task.id,
						resourceId: rowResourceId,
						text: tr.resource.name,
						start: task.startAt?.toISOString() || "",
						end: task.endAt?.toISOString() || "",
						backColor: tr.resource.color || "#3d85c6",
						fontColor: "#fff",
						resource: rowResourceId,
						bubbleHtml: `<strong>${tr.resource.name}</strong><br/>on ${task.title}`,
						moveDisabled: true,
						tags: {
							allDay: task.allDay,
							type: "TASK_ASSIGNMENT",
							resourceId: tr.resourceId,
							resourceTypes: allResourceTypes,
							initials: initials,
							allowEdit: task.createdById === userId,
						},
					});
				});
			});

			return NextResponse.json({ ok: true, data: events });
		}

		if (resourceTypeCode === "TIMEOFF") {
			const where: any = {};

			if (isValidRange) {
				where.AND = [
					{ startAt: { lte: endDate } },
					{ endAt: { gte: startDate } },
				];
			}

			if (divisions.length > 0) {
				where.resource = {
					user: {
						profile: {
							division: {
								code: { in: divisions },
							},
						},
					},
				};
			}

			const timeOffRequests = await prisma.timeOffRequest.findMany({
				where,
				include: {
					type: true,
					resource: true,
				},
			});

			const events = timeOffRequests.map((to) => ({
				id: to.id,
				resourceId: to.resourceId,
				text: `${to.type.name}${to.reason ? `: ${to.reason}` : ""}`,
				start: to.startAt.toISOString(),
				end: to.endAt.toISOString(),
				resource: to.resourceId,
				backColor: to.type.color || "#e06666",
				fontColor: "#fff",
				bubbleHtml: `<strong>${to.type.name}</strong><br/>${to.reason || ""}`,
				tags: {
					allDay: to.allDay,
					type: "TIMEOFF",
					status: to.status,
				},
			}));

			return NextResponse.json({ ok: true, data: events });
		}

		// Default Task logic
		const where: any = {
			task: {
				startAt: { not: null },
				endAt: { not: null },
			},
		};

		if (locationCategory) {
			where.task = {
				...where.task,
				location: {
					category: locationCategory,
				},
			};
		}

		if (resourceTypeCode) {
			where.resource = {
				resourceType: {
					code: resourceTypeCode,
				},
			};
		}

		if (divisions.length > 0) {
			where.resource = {
				...where.resource,
				user: {
					profile: {
						division: {
							code: { in: divisions },
						},
					},
				},
			};
		}

		if (isValidRange) {
			where.task = {
				...where.task,
				AND: [
					{ startAt: { lte: endDate } },
					{ endAt: { gte: startDate } },
				],
			};
		}

		const taskResources = await prisma.taskResource.findMany({
			where,
			include: {
				task: {
					include: {
						resources: {
							include: {
								resource: {
									include: {
										resourceType: true,
										user: {
											include: {
												profile: true,
											},
										},
									},
								},
							},
						},
					},
				},
				resource: true,
			},
		});

		const events = await Promise.all(
			taskResources.map(async (tr) => {
				const initialsList = tr.task.resources
					.filter((r) => r.resource.resourceType.code === "PEOPLE")
					.map((r) => {
						if (r.resource.user?.profile?.initials) {
							return r.resource.user.profile.initials;
						}
						return r.resource.name
							.split(" ")
							.filter(Boolean)
							.map((n: string) => n.charAt(0))
							.join("")
							.toUpperCase()
							.substring(0, 3);
					});

				const allResourceTypes = tr.task.resources.map(
					(r) => r.resource.resourceType.code,
				);

				const assigneeUserId = tr.task.resources
					.filter((r) => r.resource.resourceType.code === "PEOPLE")
					.map((r) => r.resource.userId);

				const allowEdit = await hasPermission("manage", "schedules", {
					bypassOwnership: true,
					ownerIds: [tr.task.createdById, ...assigneeUserId],
				});

				return {
					id: `${tr.taskId}_${tr.resourceId}`,
					taskId: tr.taskId,
					resourceId: tr.resourceId,
					text: tr.task.title,
					start: tr.task.startAt ? tr.task.startAt.toISOString() : "",
					end: tr.task.endAt ? tr.task.endAt.toISOString() : "",
					resource: tr.resourceId,
					backColor: tr.task.color || tr.resource.color || "#3d85c6",
					fontColor: "#fff",
					bubbleHtml: `<strong>${tr.task.title}</strong>`,
					moveDisabled: !allowEdit,
					resizeDisabled: !allowEdit,
					tags: {
						allDay: tr.task.allDay,
						type: "TASK",
						resourceTypes: allResourceTypes,
						initials: initialsList.join(", "),
						allowEdit: allowEdit,
					},
				};
			}),
		);

		return NextResponse.json({ ok: true, data: events });
	} catch (error) {
		return handleApiError(error);
	}
}
