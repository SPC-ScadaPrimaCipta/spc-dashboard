import prisma from "@/lib/prisma";
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

		// Identify the workflow to use.
		// Ideally, we fetch the active "PROJECT_PROPOSAL" workflow.
		// For now, we'll assume there's one with code 'PROJECT_APPROVAL' or similar,
		// or we just create an instance without a template if the system supports ad-hoc (unlikely).
		// Let's create a generic "Basic Approval" or look for one.
		// PROPOSAL: Just create the instance. The Workflow Engine likely picks up or we set defaults.

		// We need to look up a workflow definition.
		const workflow = await prisma.workflow.findFirst({
			where: { code: "PROJECT_PROPOSAL", is_active: true }, // Assuming seeded or exists
			orderBy: { version: "desc" },
		});

		if (!workflow) {
			return NextResponse.json(
				{
					error: "No active workflow definition found for 'PROJECT_PROPOSAL'",
				},
				{ status: 500 }
			);
		}

		// Create Workflow Instance
		const instance = await prisma.workflow_instance.create({
			data: {
				workflow_id: workflow.id,
				workflow_version: workflow.version,
				ref_type: "project_proposal",
				ref_id: proposal.id,
				status: "IN_PROGRESS",
				created_by: session.user.id,
				current_step_id: null,
			},
		});

		// Update Proposal Status
		await prisma.projectProposal.update({
			where: { id },
			data: { status: "PENDING_APPROVAL" },
		});

		return NextResponse.json({ success: true, instanceId: instance.id });
	} catch (error) {
		console.error("Submit error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
