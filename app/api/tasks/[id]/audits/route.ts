import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const userId = await requireUserId();
		const { id } = await params;

		const audits = await prisma.taskAuditTrail.findMany({
			where: { taskId: id },
			orderBy: { at: "desc" },
		});

		// Manually join actor details
		const actorIds = Array.from(
			new Set(audits.map((a) => a.byUserId).filter(Boolean) as string[]),
		);

		let actorMap = new Map();
		if (actorIds.length > 0) {
			const actors = await prisma.user.findMany({
				where: { id: { in: actorIds } },
				select: { id: true, name: true, image: true, email: true },
			});
			actorMap = new Map(actors.map((u) => [u.id, u]));
		}

		const enriched = audits.map((a) => ({
			...a,
			actor: a.byUserId ? actorMap.get(a.byUserId) : null,
		}));

		return NextResponse.json({ ok: true, data: enriched });
	} catch (error) {
		return handleApiError(error);
	}
}
