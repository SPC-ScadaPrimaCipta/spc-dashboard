import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, slugify, handleApiError } from "@/lib/task-utils";
import { z } from "zod";

const LabelCreateSchema = z.object({
	name: z.string().min(1),
	color: z.string().optional(),
});

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const search = searchParams.get("search");
		const limit = parseInt(searchParams.get("limit") || "50");

		const userId = await requireUserId(); // Only authenticated users

		const where: any = {};
		if (search) {
			where.name = { contains: search, mode: "insensitive" };
		}

		const labels = await prisma.label.findMany({
			where,
			take: limit,
			orderBy: { name: "asc" },
		});

		return NextResponse.json({ ok: true, data: labels });
	} catch (error) {
		return handleApiError(error);
	}
}

async function generateUniqueSlug(name: string) {
	let slug = slugify(name);
	let counter = 1;
	while (true) {
		const checkSlug = counter === 1 ? slug : `${slug}-${counter}`;
		const existing = await prisma.label.findUnique({
			where: { slug: checkSlug },
		});
		if (!existing) {
			return checkSlug;
		}
		counter++;
	}
}

export async function POST(req: Request) {
	try {
		const userId = await requireUserId();
		const json = await req.json();
		const body = LabelCreateSchema.parse(json);

		const slug = await generateUniqueSlug(body.name);

		const label = await prisma.label.create({
			data: {
				name: body.name,
				slug,
				color: body.color,
				createdById: userId,
			},
		});

		return NextResponse.json({ ok: true, data: label });
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
