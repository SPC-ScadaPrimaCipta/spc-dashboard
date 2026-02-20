import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import { z } from "zod";

const ResourceUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	resourceTypeId: z.string().uuid().optional(),
	code: z.string().optional(),
	color: z.string().optional(),
	userId: z.string().nullable().optional(),
	isActive: z.boolean().optional(),
});

export async function PUT(
	req: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const params = await context.params;
		const id = params.id;

		const json = await req.json();
		const body = ResourceUpdateSchema.parse(json);

		const existing = await prisma.scheduleResource.findUnique({
			where: { id },
		});

		if (!existing) {
			return NextResponse.json(
				{ ok: false, error: "Not found" },
				{ status: 404 },
			);
		}

		const resource = await prisma.scheduleResource.update({
			where: { id },
			data: {
				...body,
				updatedById: userId,
			},
		});

		return NextResponse.json({ ok: true, data: resource });
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
	context: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const params = await context.params;
		const id = params.id;

		const existing = await prisma.scheduleResource.findUnique({
			where: { id },
		});

		if (!existing) {
			return NextResponse.json(
				{ ok: false, error: "Not found" },
				{ status: 404 },
			);
		}

		await prisma.scheduleResource.delete({
			where: { id },
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		return handleApiError(error);
	}
}
