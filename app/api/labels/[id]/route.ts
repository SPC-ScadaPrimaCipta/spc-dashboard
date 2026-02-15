import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import { z } from "zod";

const LabelUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	color: z.string().optional(),
});

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const { id } = await params;
		const json = await req.json();
		const body = LabelUpdateSchema.parse(json);

		const existing = await prisma.label.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json(
				{ ok: false, error: "Label not found" },
				{ status: 404 },
			);
		}

		// Slug is immutable
		const updated = await prisma.label.update({
			where: { id },
			data: {
				name: body.name,
				color: body.color,
				updatedById: userId,
			},
		});

		return NextResponse.json({ ok: true, data: updated });
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

		// Check usage
		const usageCount = await prisma.taskLabel.count({
			where: { labelId: id },
		});

		if (usageCount > 0) {
			return NextResponse.json(
				{ ok: false, error: "Label is in use by tasks" },
				{ status: 409 },
			);
		}

		await prisma.label.delete({
			where: { id },
		});

		return NextResponse.json({ ok: true, data: { id } });
	} catch (error) {
		return handleApiError(error);
	}
}
