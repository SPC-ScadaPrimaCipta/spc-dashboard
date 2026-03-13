import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import { z } from "zod";

const HolidayCreateSchema = z.object({
	name: z.string().min(1),
	code: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	startAt: z.string().datetime({ offset: true }),
	endAt: z.string().datetime({ offset: true }),
	allDay: z.boolean().default(true),
	timezone: z.string().optional().nullable(),
});

export async function GET(req: Request) {
	try {
		await requireUserId();
		const { searchParams } = new URL(req.url);
		const year = searchParams.get("year");

		const where: any = {};
		if (year) {
			const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
			const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
			where.startAt = {
				gte: startOfYear,
				lte: endOfYear,
			};
		}

		const holidays = await prisma.holiday.findMany({
			where,
			orderBy: { startAt: "asc" },
			include: { scopes: true },
		});

		return NextResponse.json({ ok: true, data: holidays });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		const userId = await requireUserId();
		const json = await req.json();

		const body = HolidayCreateSchema.parse(json);

		const holiday = await prisma.holiday.create({
			data: {
				...body,
				createdById: userId,
				updatedById: userId,
			},
		});

		return NextResponse.json({ ok: true, data: holiday });
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
