import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";

export async function GET(req: Request) {
	try {
		await requireUserId();
		const { searchParams } = new URL(req.url);

		const resourceId = searchParams.get("resourceId");
		const typeId = searchParams.get("typeId");
		const status = searchParams.get("status");
		const startParam = searchParams.get("start");
		const endParam = searchParams.get("end");

		const where: any = {};

		if (resourceId) {
			where.resourceId = resourceId;
		}

		if (typeId) {
			where.typeId = typeId;
		}

		if (status) {
			where.status = status;
		}

		if (startParam || endParam) {
			where.AND = [];
			if (startParam) {
				where.AND.push({ endAt: { gte: new Date(startParam) } });
			}
			if (endParam) {
				where.AND.push({ startAt: { lte: new Date(endParam) } });
			}
		}

		const timeOffRequests = await prisma.timeOffRequest.findMany({
			where,
			include: {
				type: true,
				resource: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true,
							},
						},
					},
				},
				createdBy: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				startAt: "desc",
			},
		});

		return NextResponse.json({ ok: true, data: timeOffRequests });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		const userId = await requireUserId();
		const body = await req.json();

		// Basic validation could be added here similar to tasks
		const request = await prisma.timeOffRequest.create({
			data: {
				resourceId: body.resourceId,
				typeId: body.typeId,
				startAt: new Date(body.startAt),
				endAt: new Date(body.endAt),
				allDay: body.allDay ?? true,
				reason: body.reason,
				note: body.note,
				status: body.status || "DRAFT",
				createdById: userId,
			},
			include: {
				type: true,
				resource: true,
			},
		});

		return NextResponse.json({ ok: true, data: request });
	} catch (error) {
		return handleApiError(error);
	}
}
