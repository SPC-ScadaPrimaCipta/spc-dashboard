import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";

export async function GET(req: Request) {
	try {
		const userId = await requireUserId();
		const { searchParams } = new URL(req.url);
		const resourceTypeId = searchParams.get("id");
		const resourceTypeCode = searchParams.get("type");

		const where: any = {
			isActive: true,
		};

		if (resourceTypeId) {
			where.resourceTypeId = resourceTypeId;
		}

		if (resourceTypeCode) {
			where.resourceType = {
				code: resourceTypeCode,
			};
		}

		const resources = await prisma.scheduleResource.findMany({
			where,
			include: {
				resourceType: true,
				user: {
					select: {
						id: true,
						name: true,
						image: true,
						email: true,
					},
				},
			},
			orderBy: {
				name: "asc",
			},
		});

		return NextResponse.json({ ok: true, data: resources });
	} catch (error) {
		return handleApiError(error);
	}
}
