import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ workflowId: string }> }
) {
	const canUpdate = await hasPermission("update", "workflows");
	if (!canUpdate) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const { workflowId } = await params;

	if (!workflowId) {
		return new NextResponse("Workflow ID is required", { status: 400 });
	}

	try {
		const targetWorkflow = await prisma.workflow.findUnique({
			where: { id: workflowId },
		});

		if (!targetWorkflow) {
			return new NextResponse("Workflow not found", { status: 404 });
		}

		const updated = await prisma.workflow.update({
			where: { id: workflowId },
			data: { is_active: false },
		});

		return NextResponse.json({
			id: updated.id,
			code: updated.code,
			version: updated.version,
			status: "DEACTIVATED",
		});
	} catch (error) {
		console.error("Error deactivating workflow:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
