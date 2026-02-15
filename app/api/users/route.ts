import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";

export async function GET(req: Request) {
	try {
		await requireUserId();

		const { searchParams } = new URL(req.url);
		const search = searchParams.get("search");

		const where: any = {};
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			];
		}

		const users = await prisma.user.findMany({
			where,
			select: {
				id: true,
				name: true,
				image: true,
				email: true,
			},
			orderBy: { name: "asc" },
			take: 20, // Limit results
		});

		return NextResponse.json({ ok: true, data: users });
	} catch (error) {
		return handleApiError(error);
	}
}
