import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Assuming auth helper exists
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
	try {
		const h = await headers();
		const session = await auth.api.getSession({
			headers: h,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const proposals = await prisma.projectProposal.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});

		const userIds = Array.from(new Set(proposals.map((p) => p.userId)));

		const users = await prisma.user.findMany({
			where: { id: { in: userIds } },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
			},
		});

		const userMap = new Map(users.map((u) => [u.id, u]));

		const proposalsWithUser = proposals.map((p) => ({
			...p,
			user: userMap.get(p.userId) || null,
		}));

		return NextResponse.json(proposalsWithUser);
	} catch (error) {
		console.error("Error fetching proposals:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const h = await headers();
		const session = await auth.api.getSession({
			headers: h,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { title, description, budget, attachments } = body;

		if (!title) {
			return NextResponse.json(
				{ error: "Title is required" },
				{ status: 400 }
			);
		}

		const result = await prisma.$transaction(async (tx) => {
			const proposal = await tx.projectProposal.create({
				data: {
					title,
					description,
					budget,
					userId: session.user.id,
					status: "DRAFT",
				},
			});

			if (attachments && Array.isArray(attachments)) {
				await tx.attachment.createMany({
					data: attachments.map((att: any) => ({
						name: att.name,
						url: att.url,
						type: att.type,
						size: att.size,
						refType: "project_proposal",
						refId: proposal.id,
						uploadedBy: session.user.id,
					})),
				});
			}

			return proposal;
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating proposal:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
