import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";

import { formatInTimeZone } from "date-fns-tz";

const tz = "Asia/Jakarta";
const fmt = (d: Date) => formatInTimeZone(d, tz, "yyyy-MM-dd'T'HH:mm:ss");

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
			let end = tr.task.endAt;
			if (tr.task.allDay && end) {
				const endDate = new Date(end);
				endDate.setDate(endDate.getDate() + 1);
				end = endDate;
			}

			return {
				id: tr.taskId,
				taskId: tr.taskId,
				resourceId: tr.resourceId,
				text: tr.task.title,
				start: tr.task.startAt ? tr.task.startAt.toISOString() : "",
				end: end ? end.toISOString() : "",
				resource: tr.resourceId,
				backColor: tr.task.color || tr.resource.color || "#3d85c6",
				fontColor: "#fff",
				bubbleHtml: `<strong>${tr.task.title}</strong>`,
			};
		});

		return NextResponse.json({ ok: true, data: events });
	} catch (error) {
		return handleApiError(error);
	}
}
