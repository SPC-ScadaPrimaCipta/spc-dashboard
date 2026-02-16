import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import { z } from "zod";
import { TaskAuditAction } from "@prisma/client";

const CommentCreateSchema = z.object({
	body: z.string().min(1),
});

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const { id } = await params;

		const comments = await prisma.taskComment.findMany({
			where: { taskId: id },
			orderBy: { createdAt: "desc" },
			// include author? createdBy is string.
			// Need to fetch user details?
		});

		// We only have createdById string. We should fetch user details.
		// Efficiently: get unique user IDs, fetch users, map.
		const userIds = Array.from(new Set(comments.map((c) => c.createdById)));
		const users = await prisma.user.findMany({
			where: { id: { in: userIds } },
			select: { id: true, name: true, image: true, email: true },
		});
		const userMap = new Map(users.map((u) => [u.id, u]));

		const enriched = comments.map((c) => ({
			...c,
			author: userMap.get(c.createdById) || null,
		}));

		return NextResponse.json({ ok: true, data: enriched });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const { id } = await params;
		const json = await req.json();
		const body = CommentCreateSchema.parse(json);

		const result = await prisma.$transaction(async (tx) => {
			// 1. Create Comment
			const comment = await tx.taskComment.create({
				data: {
					taskId: id,
					body: body.body,
					createdById: userId,
				},
			});

			// 2. Create Audit Trail
			await tx.taskAuditTrail.create({
				data: {
					taskId: id,
					action: TaskAuditAction.COMMENT,
					byUserId: userId,
					data: {
						commentId: comment.id,
						preview: body.body.substring(0, 100),
					},
					message: "Comment added",
				},
			});

			return comment;
		});

		return NextResponse.json({ ok: true, data: result });
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
