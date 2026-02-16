import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveApprovers } from "@/lib/workflow/resolver";

export async function GET(req: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const url = new URL(req.url);
	const view = url.searchParams.get("view");

	const where: any = {};
	if (view !== "all") {
		where.created_by = session.user.id;
	}

	const instances = await prisma.workflow_instance.findMany({
		where,
		include: {
			workflow: true,
			workflow_step: true,
		},
		orderBy: {
			created_at: "desc",
		},
	});

	const userIds = Array.from(new Set(instances.map((i) => i.created_by)));
	const users = await prisma.user.findMany({
		where: {
			id: {
				in: userIds,
			},
		},
		select: {
			id: true,
			name: true,
			email: true,
			image: true,
		},
	});

	const userMap = new Map(users.map((u) => [u.id, u]));

	const formattedInstances = instances.map((instance) => ({
		id: instance.id,
		title: instance.workflow.name,
		status: instance.status === "IN_PROGRESS" ? "PENDING" : instance.status,
		currentStep: instance.workflow_step?.name || "Completed",
		createdAt: instance.created_at.toISOString(),
		updatedAt: instance.created_at.toISOString(),
		refType: instance.ref_type,
		refId: instance.ref_id,
		createdBy: userMap.get(instance.created_by),
	}));

	return NextResponse.json(formattedInstances);
}

export async function POST(req: Request) {
	// 1️⃣ Get current user
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { workflowCode, refType, refId } = await req.json();

	if (!workflowCode || !refType || !refId) {
		return new NextResponse("Invalid payload", { status: 400 });
	}

	return prisma.$transaction(async (tx) => {
		// 2️⃣ Resolve active workflow
		const workflow = await tx.workflow.findFirst({
			where: {
				code: workflowCode,
				is_active: true,
			},
			include: {
				workflow_step: {
					orderBy: { step_order: "asc" },
				},
			},
		});

		if (!workflow) {
			return new NextResponse("Workflow not found", { status: 404 });
		}

		// 3️⃣ Prevent duplicate workflow per ref (optional but recommended)
		const existing = await tx.workflow_instance.findFirst({
			where: {
				ref_type: refType,
				ref_id: refId,
			},
		});

		if (existing) {
			return new NextResponse(
				"Workflow already exists for this reference",
				{ status: 409 }
			);
		}

		// 4️⃣ Identify SUBMIT step
		const submitStep = workflow.workflow_step.find(
			(s) => s.step_key === "SUBMIT"
		);

		if (!submitStep) {
			throw new Error("SUBMIT step not defined");
		}

		// 5️⃣ Create workflow instance
		const instance = await tx.workflow_instance.create({
			data: {
				workflow_id: workflow.id,
				workflow_version: workflow.version,
				ref_type: refType,
				ref_id: refId,
				status: "IN_PROGRESS",
				current_step_id: submitStep.id,
				created_by: session.user.id,
			},
		});

		// 6️⃣ Create SUBMIT step instance (auto-approved)
		await tx.workflow_step_instance.create({
			data: {
				workflow_instance_id: instance.id,
				step_id: submitStep.id,
				status: "APPROVED",
				assigned_to: [session.user.id],
				acted_by: session.user.id,
				acted_at: new Date(),
				comment: "Submitted",
			},
		});

		// 7️⃣ Log submit action
		await tx.workflow_action_log.create({
			data: {
				workflow_instance_id: instance.id,
				action: "SUBMIT",
				from_step_id: submitStep.id,
				actor_id: session.user.id,
			},
		});

		// 8️⃣ Resolve first approval step
		const firstApprovalStep = workflow.workflow_step.find(
			(s) => s.step_order > submitStep.step_order
		);

		if (!firstApprovalStep) {
			// Edge case: submit is terminal
			await tx.workflow_instance.update({
				where: { id: instance.id },
				data: {
					status: "APPROVED",
				},
			});

			return NextResponse.json({
				instanceId: instance.id,
				status: "APPROVED",
				currentStep: null,
			});
		}

		// 9️⃣ Resolve approvers
		const assignedUsers = await resolveApprovers(firstApprovalStep, {
			workflowInstance: instance,
			submitterId: session.user.id,
			refType,
			refId,
		});

		// 🔟 Create first pending step
		await tx.workflow_step_instance.create({
			data: {
				workflow_instance_id: instance.id,
				step_id: firstApprovalStep.id,
				status: "PENDING",
				assigned_to: assignedUsers,
			},
		});

		// 1️⃣1️⃣ Move pointer
		await tx.workflow_instance.update({
			where: { id: instance.id },
			data: {
				current_step_id: firstApprovalStep.id,
			},
		});

		return NextResponse.json({
			instanceId: instance.id,
			status: "IN_PROGRESS",
			currentStep: {
				stepKey: firstApprovalStep.step_key,
				assignedTo: assignedUsers,
			},
		});
	});
}
