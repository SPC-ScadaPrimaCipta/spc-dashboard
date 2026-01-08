import prisma from "@/lib/prisma"; // Corrected import
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const refType = searchParams.get("refType");
	const refId = searchParams.get("refId");

	if (!refType || !refId) {
		return NextResponse.json(
			{ error: "Missing refType or refId" },
			{ status: 400 }
		);
	}

	try {
		const attachments = await prisma.attachment.findMany({
			where: {
				refType,
				refId,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(attachments);
	} catch (error) {
		console.error("Error fetching attachments:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
