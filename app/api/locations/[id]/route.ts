import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import { LocationUpdateSchema } from "@/lib/location-validators";
import { z } from "zod";

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireUserId();
		const { id } = await params;

		const location = await prisma.location.findUnique({
			where: { id },
		});

		if (!location) {
			return NextResponse.json(
				{ ok: false, error: "Location not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ ok: true, data: location });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireUserId();
		const { id } = await params;
		const json = await req.json();
		const body = LocationUpdateSchema.parse(json);

		const location = await prisma.location.update({
			where: { id },
			data: body,
		});

		return NextResponse.json({ ok: true, data: location });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ ok: false, error: error.flatten() },
				{ status: 400 },
			);
		}
		if ((error as any).code === "P2002") {
			return NextResponse.json(
				{
					ok: false,
					error: "A location with this code already exists.",
				},
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
		await requireUserId();
		const { id } = await params;

		// Check if location is in use by tasks
		const taskCount = await prisma.task.count({
			where: { locationId: id },
		});

		if (taskCount > 0) {
			return NextResponse.json(
				{
					ok: false,
					error: "Cannot delete location as it is being used by tasks. Consider deactivating it instead.",
				},
				{ status: 400 },
			);
		}

		await prisma.location.delete({
			where: { id },
		});

		return NextResponse.json({ ok: true, data: { id } });
	} catch (error) {
		return handleApiError(error);
	}
}
