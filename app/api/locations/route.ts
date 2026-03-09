import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import { LocationCategory } from "@prisma/client";
import { LocationCreateSchema } from "@/lib/location-validators";
import { z } from "zod";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);

		// Ensure user is authenticated
		await requireUserId();

		const activeOnlyParam = searchParams.get("activeOnly");
		const categoryParam = searchParams.get("category");

		const where: any = {};

		// If activeOnly is not explicitly false, filter by isActive=true
		if (activeOnlyParam !== "false") {
			where.isActive = true;
		}

		if (categoryParam) {
			where.category = categoryParam as LocationCategory;
		}

		const locations = await prisma.location.findMany({
			where,
			orderBy: { sortOrder: "asc" },
		});

		return NextResponse.json({ ok: true, data: locations });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		const userId = await requireUserId();
		const json = await req.json();
		const body = LocationCreateSchema.parse(json);

		const location = await prisma.location.create({
			data: body,
		});

		return NextResponse.json({ ok: true, data: location });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ ok: false, error: error.flatten() },
				{ status: 400 },
			);
		}
		// Handle potential database unique constraint violations
		if ((error as any).code === "P2002") {
			return NextResponse.json(
				{
					ok: false,
					error: "A location with this code already exists.",
				},
				{ status: 400 },
			);
		}
		return handleApiError(error);
	}
}
