import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import xlsx from "node-xlsx";

export async function GET(req: Request) {
	try {
		await requireUserId();
		const { searchParams } = new URL(req.url);

		const startParam = searchParams.get("start");
		const endParam = searchParams.get("end");
		const resourceTypeCode = searchParams.get("type");
		const filetype = searchParams.get("filetype") || "xlsx";

		const where: any = {
			task: {
				startAt: { not: null },
				endAt: { not: null },
			},
		};

		if (resourceTypeCode) {
			where.resource = {
				resourceType: {
					code: resourceTypeCode,
				},
			};
		}

		if (startParam && endParam) {
			const startDate = new Date(startParam);
			const endDate = new Date(endParam);

			if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
				where.task = {
					...where.task,
					AND: [
						{ startAt: { lte: endDate } },
						{ endAt: { gte: startDate } },
					],
				};
			}
		}

		const taskResources = await prisma.taskResource.findMany({
			where,
			include: {
				task: {
					include: {
						status: true,
						assignments: {
							include: {
								assignee: {
									select: { name: true, email: true },
								},
							},
						},
					},
				},
				resource: {
					include: {
						resourceType: true,
					},
				},
			},
			orderBy: {
				task: {
					startAt: "asc",
				},
			},
			take: 10000, // Export limit
		});

		// Flat format for export
		const exportData = taskResources.map((tr) => {
			const task = tr.task;
			const resource = tr.resource;
			const assignees = task.assignments
				?.map((a: any) => a.assignee.name)
				.join(", ");

			let end = task.endAt;
			if (task.allDay && end) {
				const endDate = new Date(end);
				endDate.setDate(endDate.getDate() + 1);
				end = endDate;
			}

			return {
				TasksID: task.id,
				Title: task.title,
				Type: task.type,
				Priority: task.priority,
				Status: task.status?.name || "",
				ResourceName: resource.name,
				ResourceCode: resource.code || "",
				ResourceType: resource.resourceType?.code || "",
				StartAt: task.startAt ? task.startAt.toISOString() : "",
				EndAt: end ? end.toISOString() : "",
				AllDay: task.allDay ? "Yes" : "No",
				DurationMin: task.durationMin,
				Progress: task.progress,
				Assignees: assignees,
				Color: task.color || "",
			};
		});

		const suffixDate = `${startParam || "all"}_${endParam || "all"}`;

		if (filetype.toLowerCase() === "json") {
			const filename = `schedule_events_export_${suffixDate}.json`;
			return new NextResponse(JSON.stringify(exportData, null, 2), {
				headers: {
					"Content-Type": "application/json",
					"Content-Disposition": `attachment; filename="${filename}"`,
				},
			});
		}

		// Fallback to xlsx
		const headers = [
			"Task ID",
			"Title",
			"Type",
			"Priority",
			"Status",
			"Resource Name",
			"Resource Code",
			"Resource Type",
			"Start At",
			"End At",
			"All Day",
			"Duration (min)",
			"Progress",
			"Assignees",
			"Color",
		];

		const rows = exportData.map((row) => [
			row.TasksID,
			row.Title,
			row.Type,
			row.Priority,
			row.Status,
			row.ResourceName,
			row.ResourceCode,
			row.ResourceType,
			row.StartAt,
			row.EndAt,
			row.AllDay,
			row.DurationMin,
			row.Progress,
			row.Assignees,
			row.Color,
		]);

		const buffer = xlsx.build([
			{ name: "Events", data: [headers, ...rows], options: {} },
		]);

		const filename = `schedule_events_export_${suffixDate}.xlsx`;
		return new NextResponse(buffer as any, {
			headers: {
				"Content-Type":
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		return handleApiError(error);
	}
}
