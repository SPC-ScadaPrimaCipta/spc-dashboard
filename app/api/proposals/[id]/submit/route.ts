import prisma from "@/lib/prisma";
import { startWorkflow } from "@/lib/workflow/start-workflow";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const h = await headers();
	const session = await auth.api.getSession({
		headers: h,
	});

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const proposal = await prisma.projectProposal.findUnique({
			where: { id },
		});

		if (!proposal) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		if (proposal.status !== "DRAFT" && proposal.status !== "REJECTED") {
			return NextResponse.json(
				{ error: "Only DRAFT or REJECTED proposals can be submitted" },
				{ status: 400 }
			);
		}

		// Create Workflow Instance using the helper function
		let instance;
		try {
			instance = await startWorkflow({
				workflowCode: "PROJECT_PROPOSAL",
				refType: "project_proposal",
				refId: proposal.id,
				userId: session.user.id,
			});
		} catch (error: any) {
			return NextResponse.json(
				{
					error: error.message || "Failed to start workflow",
				},
				{ status: 500 }
			);
		}

		// Update Proposal Status
		await prisma.projectProposal.update({
			where: { id },
			data: { status: "PENDING_APPROVAL" },
		});

		return NextResponse.json({
			success: true,
			instanceId: instance.instanceId,
		});
	} catch (error) {
		console.error("Submit error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
