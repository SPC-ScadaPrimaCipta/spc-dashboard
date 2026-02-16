import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, requireAdmin, handleApiError } from "@/lib/task-utils";
import { z } from "zod";

const CommentUpdateSchema = z.object({
	body: z.string().min(1),
});

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const { id } = await params;
		const json = await req.json();
		const body = CommentUpdateSchema.parse(json);

		const comment = await prisma.taskComment.findUnique({ where: { id } });
		if (!comment) {
			return NextResponse.json(
				{ ok: false, error: "Comment not found" },
				{ status: 404 },
			);
		}

		// Check ownership or admin
		// We can't easily check 'admin' role unless we use requireAdmin helper but that throws if not admin.
		// Here we want (Owner OR Admin).
		let isAllowed = comment.createdById === userId;
		if (!isAllowed) {
			// Check if admin
			try {
				await requireAdmin();
				isAllowed = true;
			} catch {
				isAllowed = false;
			}
		}

		if (!isAllowed) {
			return NextResponse.json(
				{ ok: false, error: "Forbidden" },
				{ status: 403 },
			);
		}

		const updated = await prisma.taskComment.update({
			where: { id },
			data: {
				body: body.body,
				isEdited: true,
				updatedById: userId,
			},
		});

		return NextResponse.json({ ok: true, data: updated });
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

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const { id } = await params;

		const comment = await prisma.taskComment.findUnique({ where: { id } });
		if (!comment) {
			return NextResponse.json(
				{ ok: false, error: "Comment not found" },
				{ status: 404 },
			);
		}

		let isAllowed = comment.createdById === userId;
		if (!isAllowed) {
			try {
				await requireAdmin();
				isAllowed = true;
			} catch {
				isAllowed = false;
			}
		}

		if (!isAllowed) {
			return NextResponse.json(
				{ ok: false, error: "Forbidden" },
				{ status: 403 },
			);
		}

		await prisma.taskComment.delete({
			where: { id },
		});

		return NextResponse.json({ ok: true, data: { id } });
	} catch (error) {
		return handleApiError(error);
	}
}
