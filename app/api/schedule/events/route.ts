import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";

export async function GET(req: Request) {
	try {
		await requireUserId();
		const { searchParams } = new URL(req.url);

		const startParam = searchParams.get("start");
		const endParam = searchParams.get("end");
		const resourceTypeCode = searchParams.get("type");

		const where: any = {
			task: {
				startAt: { not: null },
				endAt: { not: null },
			},
		};

		if (resourceTypeCode) {
			where.resource = {
				resourceType: {
					code: resourceTypeCode,
				},
			};
		}

		if (startParam && endParam) {
			const startDate = new Date(startParam);
			const endDate = new Date(endParam);

			if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
				where.task = {
					...where.task,
					AND: [
						{ startAt: { lte: endDate } },
						{ endAt: { gte: startDate } },
					],
				};
			}
		}

		const taskResources = await prisma.taskResource.findMany({
			where,
			include: {
				task: true,
				resource: true,
			},
		});

		const events = taskResources.map((tr) => {
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
				tags: {
					allDay: tr.task.allDay,
				},
			};
		});

		return NextResponse.json({ ok: true, data: events });
	} catch (error) {
		return handleApiError(error);
	}
}
