import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: Request) {
	// Optional permission checks. To view divisions, user might need to read users/divisions, or just be logged in.
	// For now, let's just make sure they are authenticated if needed.
	// The problem statement says "For division create on /api/divisions".
	try {
		const divisions = await prisma.division.findMany({
			where: { isActive: true },
			orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
		});
		return NextResponse.json(divisions);
	} catch (error) {
		console.error("List divisions error", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
