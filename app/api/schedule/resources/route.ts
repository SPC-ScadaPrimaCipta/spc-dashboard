import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: Request) {
	try {
		const userId = await requireUserId();
		const { searchParams } = new URL(req.url);
		const resourceTypeId = searchParams.get("id");
		let resourceType = searchParams.get("type");
		const resourceTypeCode =
			resourceType === "TIMEOFF" ? "PEOPLE" : resourceType;
		const divisionParams = searchParams.getAll("division");
		const divisions = divisionParams
			.flatMap((d) => d.split(","))
			.filter(Boolean);
		const locationCategory = searchParams.get("loc");

		if (resourceTypeCode === "TASK") {
			const startParam = searchParams.get("start");
			const endParam = searchParams.get("end");
			const startDate = startParam ? new Date(startParam) : null;
			const endDate = endParam ? new Date(endParam) : null;

			const taskWhere: any = {
				status: { isActive: true },
			};

			if (locationCategory) {
				taskWhere.location = {
					category: locationCategory,
				};
			}

			if (startDate && endDate) {
				taskWhere.AND = [
					{ startAt: { lte: endDate } },
					{ endAt: { gte: startDate } },
				];
			}

			const tasks = await prisma.task.findMany({
				where: taskWhere,
				include: { status: true },
				orderBy: { startAt: "asc" },
			});

			// Grouping: DayPilot likes unique IDs.
			// User wants code if exists, else ID.
			// If we group, we unique them.
			const seen = new Set();
			const taskResources = tasks
				.map((t) => ({
					id: t.code || t.id,
					name: t.title,
					color: t.color || "#3d85c6",
					// Additional data for DayPilot
				}))
				.filter((tr) => {
					if (seen.has(tr.id)) return false;
					seen.add(tr.id);
					return true;
				});

			return NextResponse.json({ ok: true, data: taskResources });
		}

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
								initials: true,
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

		const data = await Promise.all(
			sortedResources.map(async (resource) => {
				const allowCreate =
					resourceTypeCode === "PEOPLE" ||
					resourceTypeCode === "TIMEOFF"
						? await hasPermission("manage", "schedules", {
								bypassOwnership: true,
								ownerIds: [resource.userId],
							})
						: true;

				return { ...resource, allowCreate };
			}),
		);

		return NextResponse.json({ ok: true, data });
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
