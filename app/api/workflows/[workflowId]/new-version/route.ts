import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ workflowId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { workflowId } = await params;

		const result = await prisma.$transaction(async (tx) => {
			const source = await tx.workflow.findUnique({
				where: { id: workflowId },
				include: { workflow_step: true },
			});

			if (!source) {
				throw new Error("Source workflow not found");
			}

			const maxVersion = await tx.workflow.aggregate({
				where: { code: source.code },
				_max: { version: true },
			});

			const newVersion = (maxVersion._max.version ?? 0) + 1;

			const newWorkflow = await tx.workflow.create({
				data: {
					code: source.code,
					name: source.name,
					description: source.description,
					version: newVersion,
					is_active: false,
					created_by: session.user.id,
				},
			});

			for (const step of source.workflow_step) {
				await tx.workflow_step.create({
					data: {
						workflow_id: newWorkflow.id,
						step_key: step.step_key,
						step_order: step.step_order,
						name: step.name,
						approver_strategy: step.approver_strategy,
						approver_value: step.approver_value,
						approval_mode: step.approval_mode,
						can_send_back: step.can_send_back,
						reject_target_type: step.reject_target_type,
						reject_target_step_id: null, // remap later if needed
						is_terminal: step.is_terminal,
					},
				});
			}

			return newWorkflow;
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating new workflow version:", error);
		if (
			error instanceof Error &&
			error.message === "Source workflow not found"
		) {
			return new NextResponse("Workflow not found", { status: 404 });
		}
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
