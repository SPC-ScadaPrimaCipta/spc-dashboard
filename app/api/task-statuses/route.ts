import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, handleApiError, slugify } from "@/lib/task-utils";
import { z } from "zod";

const StatusCreateSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	isTerminal: z.boolean().default(false),
	sortOrder: z.number().int().default(0),
	isActive: z.boolean().default(true),
});

export async function GET() {
	try {
		const statuses = await prisma.taskStatus.findMany({
			orderBy: [
				{ sortOrder: "asc" },
				{ isActive: "desc" },
				{ name: "asc" },
			],
		});
		return NextResponse.json({ ok: true, data: statuses });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		const userId = await requireAdmin();
		const json = await req.json();
		const body = StatusCreateSchema.parse(json);

		// Generate code from name (UPPER_SNAKE)
		const code = body.name
			.toUpperCase()
			.replace(/\s+/g, "_")
			.replace(/[^A-Z0-9_]/g, "");

		// Check if code exists
		const existing = await prisma.taskStatus.findUnique({
			where: { code },
		});
		if (existing) {
			return NextResponse.json(
				{
					ok: false,
					error: "Status with this name/code already exists",
				},
				{ status: 409 },
			);
		}

		const status = await prisma.taskStatus.create({
			data: {
				...body,
				code,
				createdById: userId,
			},
		});

		return NextResponse.json({ ok: true, data: status });
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
