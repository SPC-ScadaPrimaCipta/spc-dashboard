import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireUserId();
		const { id } = await params;

		const request = await prisma.timeOffRequest.findUnique({
			where: { id },
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
		});

		if (!request) {
			return NextResponse.json(
				{ ok: false, error: "Time off request not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ ok: true, data: request });
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
		const body = await req.json();

		const updates: any = {};
		if (body.typeId !== undefined) updates.typeId = body.typeId;
		if (body.resourceId !== undefined) updates.resourceId = body.resourceId;
		if (body.startAt !== undefined)
			updates.startAt = new Date(body.startAt);
		if (body.endAt !== undefined) updates.endAt = new Date(body.endAt);
		if (body.allDay !== undefined) updates.allDay = body.allDay;
		if (body.reason !== undefined) updates.reason = body.reason;
		if (body.note !== undefined) updates.note = body.note;
		if (body.status !== undefined) updates.status = body.status;

		const request = await prisma.timeOffRequest.update({
			where: { id },
			data: {
				...updates,
				updatedById: userId,
			},
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
			},
		});

		return NextResponse.json({ ok: true, data: request });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireUserId();
		const { id } = await params;

		await prisma.timeOffRequest.delete({
			where: { id },
		});

		return NextResponse.json({ ok: true, data: { id } });
	} catch (error) {
		return handleApiError(error);
	}
}
