import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ workflowId: string }> }
) {
	// 1️⃣ Permission
	const canCreate = await hasPermission("create", "workflow_steps");
	if (!canCreate) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	// 2️⃣ Auth
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { workflowId } = await params;
	const body = await req.json();

	// Normalize to array
	const stepsToCreate = Array.isArray(body) ? body : [body];

	return prisma
		.$transaction(async (tx) => {
			// 3️⃣ Ensure workflow exists & editable
			const workflow = await tx.workflow.findUnique({
				where: { id: workflowId },
			});

			if (!workflow) {
				return new NextResponse("Workflow not found", { status: 404 });
			}

			if (workflow.is_active) {
				return new NextResponse("Cannot modify active workflow", {
					status: 409,
				});
			}

			// 3.5 Delete existing steps
			await tx.workflow_step.deleteMany({
				where: { workflow_id: workflowId },
			});

			const createdSteps = [];

			for (const stepData of stepsToCreate) {
				const {
					step_key,
					name,
					step_order,
					approver_strategy,
					approver_value,
					approval_mode = "ANY",
					can_send_back = true,
					reject_target_type,
					reject_target_step_id,
					is_terminal = false,
				} = stepData;

				// 4️⃣ Basic validation
				if (
					!step_key ||
					!name ||
					step_order === undefined ||
					!approver_strategy ||
					!approver_value ||
					!reject_target_type
				) {
					throw new Error(
						`Invalid payload for step ${step_key || "unknown"}`
					);
				}

				if (
					reject_target_type === "SPECIFIC" &&
					!reject_target_step_id
				) {
					// Validate specific reject target if needed
				}

				// 5️⃣ Uniqueness checks
				const conflict = await tx.workflow_step.findFirst({
					where: {
						workflow_id: workflowId,
						OR: [{ step_key }, { step_order }],
					},
				});

				if (conflict) {
					throw new Error(
						`Step key '${step_key}' or order '${step_order}' already exists`
					);
				}

				// 6️⃣ Only one terminal step allowed
				if (is_terminal) {
					const existingTerminal = await tx.workflow_step.findFirst({
						where: {
							workflow_id: workflowId,
							is_terminal: true,
						},
					});

					if (existingTerminal) {
						throw new Error("Workflow already has a terminal step");
					}
				}

				// 7️⃣ Create step
				const newStep = await tx.workflow_step.create({
					data: {
						workflow_id: workflowId,
						step_key,
						step_order,
						name,
						approver_strategy,
						// Convert array to JSON string
						approver_value: JSON.stringify(approver_value),
						approval_mode,
						can_send_back,
						reject_target_type,
						reject_target_step_id: reject_target_step_id ?? null,
						is_terminal,
					},
				});
				createdSteps.push(newStep);
			}

			return NextResponse.json(createdSteps, { status: 201 });
		})
		.catch((error) => {
			return new NextResponse(error.message || "Internal Server Error", {
				status: 400,
			});
		});
}

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ workflowId: string }> }
) {
	const { workflowId } = await params;
	const steps = await prisma.workflow_step.findMany({
		where: { workflow_id: workflowId },
		orderBy: { step_order: "asc" },
	});

	const processedSteps = await resolveWorkflowStepApprovers(steps);

	return NextResponse.json(processedSteps);
}

// Helper function to resolve approvers
async function resolveWorkflowStepApprovers(steps: any[]) {
	// Collect IDs/Codes to resolve
	const userIds = new Set<string>();
	const roleCodes = new Set<string>();

	steps.forEach((step) => {
		let values: string[] = [];
		try {
			const parsed = JSON.parse(step.approver_value);
			if (Array.isArray(parsed)) {
				values = parsed;
			} else {
				values = [String(parsed)];
			}
		} catch {
			values = [step.approver_value];
		}

		if (step.approver_strategy === "USER") {
			values.forEach((v) => {
				if (v) userIds.add(v);
			});
		} else if (step.approver_strategy === "ROLE") {
			values.forEach((v) => {
				if (v) roleCodes.add(v);
			});
		}
	});

	// Fetch Data
	const users =
		userIds.size > 0
			? await prisma.user.findMany({
					where: { id: { in: Array.from(userIds) } },
					select: { id: true, name: true, email: true, image: true },
			  })
			: [];

	const roles =
		roleCodes.size > 0
			? await prisma.role.findMany({
					where: {
						OR: [
							{ name: { in: Array.from(roleCodes) } },
							{ id: { in: Array.from(roleCodes) } },
						],
					},
					select: { id: true, name: true, description: true },
			  })
			: [];

	// Map Data
	const userMap = new Map(users.map((u) => [u.id, u]));

	// Process steps
	return steps.map((s) => {
		let val = s.approver_value;
		let parsedValues: string[] = [];
		try {
			const parsed = JSON.parse(val);
			if (Array.isArray(parsed)) {
				val = parsed.join(",");
				parsedValues = parsed;
			} else {
				parsedValues = [String(parsed)];
			}
		} catch (e) {
			parsedValues = [val];
		}

		let resolved_approvers: any[] = [];

		if (s.approver_strategy === "USER") {
			resolved_approvers = parsedValues
				.map((id) => userMap.get(id))
				.filter((u) => u !== undefined);
		} else if (s.approver_strategy === "ROLE") {
			resolved_approvers = parsedValues
				.map((v) => roles.find((r) => r.name === v || r.id === v))
				.filter((r) => r !== undefined);
		}

		return {
			...s,
			approver_value: val,
			resolved_approvers, // Send resolved objects to frontend
		};
	});
}
