import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import { z } from "zod";

export async function GET(req: Request) {
	try {
		const userId = await requireUserId();
		const { searchParams } = new URL(req.url);
		const resourceTypeId = searchParams.get("id");
		const resourceTypeCode = searchParams.get("type");
		const divisionParams = searchParams.getAll("division");
		const divisions = divisionParams
			.flatMap((d) => d.split(","))
			.filter(Boolean);

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

		if (resourceTypeCode === "PEOPLE" && divisions.length > 0) {
			where.user = {
				profile: {
					division: {
						code: { in: divisions },
					},
				},
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
						profile: {
							select: {
								position: true,
								division: {
									select: {
										name: true,
										code: true,
										color: true,
									},
								},
								sortOrder: true,
							},
						},
					},
				},
			},
			orderBy: {
				name: "asc",
			},
		});

		let sortedResources = resources;

		if (resourceTypeCode === "PEOPLE") {
			// Sort by user profile sortOrder
			sortedResources = resources.sort((a, b) => {
				const sortOrderA = a.user?.profile?.sortOrder ?? 0;
				const sortOrderB = b.user?.profile?.sortOrder ?? 0;
				if (sortOrderA < sortOrderB) return -1;
				if (sortOrderA > sortOrderB) return 1;
				return 0;
			});
		}

		return NextResponse.json({ ok: true, data: sortedResources });
	} catch (error) {
		return handleApiError(error);
	}
}

const ResourceCreateSchema = z.object({
	name: z.string().min(1),
	resourceTypeId: z.string().uuid(),
	code: z.string().optional(),
	color: z.string().optional(),
	userId: z.string().nullable().optional(),
	isActive: z.boolean().default(true),
});

export async function POST(req: Request) {
	try {
		const userId = await requireUserId();
		const json = await req.json();
		const body = ResourceCreateSchema.parse(json);

		const resource = await prisma.scheduleResource.create({
			data: {
				name: body.name,
				resourceTypeId: body.resourceTypeId,
				code: body.code,
				color: body.color,
				userId: body.userId,
				isActive: body.isActive,
				createdById: userId,
				updatedById: userId,
			},
		});

		return NextResponse.json({ ok: true, data: resource });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ ok: false, error: error.flatten() },
				{ status: 400 },
			);
		}
		return handleApiError(error);
	}
}
