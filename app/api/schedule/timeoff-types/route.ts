import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";

export async function GET() {
	try {
		await requireUserId();
		const types = await prisma.timeOffType.findMany({
			where: { isActive: true },
			orderBy: { sortOrder: "asc" },
		});

		return NextResponse.json({ ok: true, data: types });
	} catch (error) {
		return handleApiError(error);
	}
}
