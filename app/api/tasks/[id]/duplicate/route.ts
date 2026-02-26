import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import { hasPermission } from "@/lib/rbac";

type ResourceMode = "REPLACE" | "ADD" | "KEEP";

function parseISOOrThrow(value: unknown, field: string): Date {
	if (typeof value !== "string")
		throw new Error(`${field} must be string ISO date`);
	const d = new Date(value);
	if (isNaN(d.getTime())) throw new Error(`${field} invalid ISO date`);
	return d;
}

export async function POST(
	req: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const canCreate = await hasPermission("manage", "schedules");
		if (!canCreate) return new NextResponse("Forbidden", { status: 403 });

		const userId = await requireUserId();
		const { id: sourceTaskId } = await params;

		const body = await req.json();

		const startAt = parseISOOrThrow(body.startAt, "startAt");
		const targetResourceId =
			typeof body.targetResourceId === "string"
				? body.targetResourceId
				: null;

		const resourceMode: ResourceMode =
			body.resourceMode === "ADD" || body.resourceMode === "KEEP"
				? body.resourceMode
				: "REPLACE";

		const resetStatus = body.resetStatus !== false; // default true
		const resetProgress = body.resetProgress !== false; // default true

		// durationMin is optional; backend can compute from source task if missing
		const durationMinInput =
			typeof body.durationMin === "number" &&
			Number.isFinite(body.durationMin) &&
			body.durationMin >= 0
				? Math.round(body.durationMin)
				: null;

		// Load source task + relations needed for cloning
		const source = await prisma.task.findUnique({
			where: { id: sourceTaskId },
			include: {
				labels: { include: { label: true } }, // TaskLabel[]
				resources: {
					include: { resource: { include: { resourceType: true } } },
				},
			},
		});

		if (!source) return new NextResponse("Not Found", { status: 404 });

		// Determine duration (minutes)
		let durationMin = durationMinInput;
		if (durationMin == null) {
			if (source.durationMin != null) durationMin = source.durationMin;
			else if (source.startAt && source.endAt) {
				durationMin = Math.round(
					(source.endAt.getTime() - source.startAt.getTime()) / 60000,
				);
			} else {
				// fallback default duration if source is unscheduled
				durationMin = 60;
			}
		}

		// Compute endAt from startAt + durationMin
		const endAt = new Date(startAt.getTime() + durationMin * 60000);

		// Decide new resources
		const sourceResourceIds = source.resources.map((r) => r.resourceId);
		let newResourceIds: string[] = [];

		if (!targetResourceId) {
			// if no target provided, keep original resources
			newResourceIds = sourceResourceIds;
		} else {
			if (resourceMode === "KEEP") newResourceIds = sourceResourceIds;
			else if (resourceMode === "ADD")
				newResourceIds = Array.from(
					new Set([...sourceResourceIds, targetResourceId]),
				);
			else newResourceIds = [targetResourceId]; // REPLACE
		}

		// Reset status to TODO if requested
		let newStatusId = source.statusId;
		if (resetStatus) {
			const todo = await prisma.taskStatus.findUnique({
				where: { code: "TODO" },
				select: { id: true },
			});
			if (todo) newStatusId = todo.id;
		}

		const created = await prisma.$transaction(async (tx) => {
			const newTask = await tx.task.create({
				data: {
					title: source.title,
					description: source.description,
					type: source.type,
					priority: source.priority,
					statusId: newStatusId,

					startAt,
					endAt,
					allDay: source.allDay,
					timezone: source.timezone,
					durationMin,

					progress: resetProgress ? 0 : source.progress,
					color: source.color,

					createdById: userId,
					updatedById: userId,
				},
			});

			// Copy labels
			if (source.labels.length) {
				await tx.taskLabel.createMany({
					data: source.labels.map((tl) => ({
						taskId: newTask.id,
						labelId: tl.labelId,
						assignedById: userId,
					})),
					skipDuplicates: true,
				});
			}

			// Attach resources
			if (newResourceIds.length) {
				await tx.taskResource.createMany({
					data: newResourceIds.map((rid) => ({
						taskId: newTask.id,
						resourceId: rid,
						assignedById: userId,
					})),
					skipDuplicates: true,
				});
			}

			// Audit trail
			await tx.taskAuditTrail.create({
				data: {
					taskId: newTask.id,
					action: "CREATE",
					byUserId: userId,
					message: "Task duplicated",
					data: {
						duplicatedFrom: sourceTaskId,
						targetResourceId,
						resourceMode,
						durationMin,
						startAt: startAt.toISOString(),
						endAt: endAt.toISOString(),
					},
				},
			});

			return newTask;
		});

		// Return DayPilot-ready event (single event for the target resource)
		// If task has multiple resources, FE usually wants multiple events.
		// For paste, return one event for targetResourceId if provided, else first resource.
		const resourceForEvent = targetResourceId ?? newResourceIds[0] ?? "";

		const toDayPilot = (d: Date) => d.toISOString().split(".")[0]; // UTC ISO without ms

		return NextResponse.json({
			ok: true,
			data: {
				id: `${created.id}:${resourceForEvent}`,
				taskId: created.id,
				text: created.title,
				start: toDayPilot(created.startAt ?? startAt),
				end: toDayPilot(created.endAt ?? endAt),
				resource: resourceForEvent,
				barColor: created.color ?? "#3d85c6",
				tags: { allDay: created.allDay, durationMin },
			},
		});
	} catch (error) {
		return handleApiError(error);
	}
}
