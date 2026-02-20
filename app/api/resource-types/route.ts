import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/task-utils";
import { z } from "zod";
import { handleApiError } from "@/lib/api-utils";

const ResourceTypeCreateSchema = z.object({
	name: z.string().min(1),
	code: z.string().optional(),
	description: z.string().optional(),
	sortOrder: z.number().int().default(0),
	isActive: z.boolean().default(true),
});

export async function GET() {
	try {
		const resourceTypes = await prisma.resourceType.findMany({
			orderBy: [
				{ sortOrder: "asc" },
				{ isActive: "desc" },
				{ name: "asc" },
			],
		});
		return NextResponse.json({ ok: true, data: resourceTypes });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		const userId = await requireAdmin();
		const json = await req.json();
		const body = ResourceTypeCreateSchema.parse(json);

		let code = body.code;
		if (!code) {
			// Generate code from name (UPPER_SNAKE) if not provided
			code = body.name
				.toUpperCase()
				.replace(/\s+/g, "_")
				.replace(/[^A-Z0-9_]/g, "");
		}

		// Check if code exists
		const existing = await prisma.resourceType.findUnique({
			where: { code },
		});

		if (existing) {
			return NextResponse.json(
				{
					ok: false,
					error: "Resource Type with this code already exists",
				},
				{ status: 409 },
			);
		}

		const resourceType = await prisma.resourceType.create({
			data: {
				name: body.name,
				code,
				description: body.description,
				sortOrder: body.sortOrder,
				isActive: body.isActive,
				createdById: userId,
				updatedById: userId,
			},
		});

		return NextResponse.json({ ok: true, data: resourceType });
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
