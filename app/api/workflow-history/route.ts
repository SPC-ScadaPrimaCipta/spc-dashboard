import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: Request) {
	const canRead = await hasPermission("read", "workflow_history");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const history = await prisma.workflow_action_log.findMany({
		include: {
			workflow_instance: {
				include: {
					workflow: true,
				},
			},
		},
		orderBy: {
			created_at: "desc",
		},
		take: 100, // Limit to 100 for now to prevent overload
	});

	const actorIds = Array.from(new Set(history.map((h) => h.actor_id)));
	const actors = await prisma.user.findMany({
		where: { id: { in: actorIds } },
		select: { id: true, name: true, email: true },
	});
	const actorMap = new Map(actors.map((a) => [a.id, a]));

	const formattedHistory = history.map((log) => ({
		id: log.id,
		workflowTitle: log.workflow_instance.workflow.name,
		action: log.action,
		performedBy: actorMap.get(log.actor_id)?.name || "Unknown",
		details: log.comment || `Action: ${log.action}`,
		timestamp: log.created_at.toISOString(),
	}));

	return NextResponse.json(formattedHistory);
}
