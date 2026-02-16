import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { workflow_step_instance } from "@prisma/client";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	try {
		const h = await headers();
		const session = await auth.api.getSession({
			headers: h,
		});

		const proposal = await prisma.projectProposal.findUnique({
			where: { id },
		});

		if (!proposal) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		// Fetch attachments manually or could use virtual relation if defined in schema,
		// but schema has no direct relation field for polymorphic.
		const attachments = await prisma.attachment.findMany({
			where: {
				refType: "project_proposal",
				refId: id,
			},
		});

		const user = await prisma.user.findUnique({
			where: { id: proposal.userId },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
			},
		});

		let currentStepInstanceId = null;

		if (session?.user?.id) {
			const workflowInstance = await prisma.workflow_instance.findUnique({
				where: {
					ref_type_ref_id: {
						ref_type: "project_proposal",
						ref_id: id,
					},
				},
			});

			if (workflowInstance) {
				const stepInstances =
					await prisma.workflow_step_instance.findMany({
						where: {
							workflow_instance_id: workflowInstance.id,
							status: "PENDING",
						},
					});

				const assignment = stepInstances.find(
					(step: workflow_step_instance) => {
						const assigned = step.assigned_to as string[];
						return (
							Array.isArray(assigned) &&
							assigned.includes(session.user.id)
						);
					},
				);

				if (assignment) {
					currentStepInstanceId = assignment.id;
				}
			}
		}

		return NextResponse.json({
			...proposal,
			attachments,
			user,
			currentStepInstanceId,
		});
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
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
		// Delete attachments first (or let DB cascade if possible, but polymorphic requires manual or trigger usually)
		// Prisma doesn't support polymorphic cascade natively easily without relation field.
		await prisma.attachment.deleteMany({
			where: {
				refType: "project_proposal",
				refId: id,
			},
		});

		await prisma.projectProposal.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const h = await headers();
	const session = await auth.api.getSession({
		headers: h,
	});

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const proposal = await prisma.projectProposal.update({
			where: { id },
			data: body,
		});

		return NextResponse.json(proposal);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
