import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/task-utils";
import { z } from "zod";

const StatusUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	isTerminal: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
	isActive: z.boolean().optional(),
});

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireAdmin();
		const { id } = await params;
		const json = await req.json();
		const body = StatusUpdateSchema.parse(json);

		// Ensure status exists
		const existing = await prisma.taskStatus.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json(
				{ ok: false, error: "Status not found" },
				{ status: 404 },
			);
		}

		const updated = await prisma.taskStatus.update({
			where: { id },
			data: {
				...body,
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
