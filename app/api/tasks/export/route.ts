import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import xlsx from "node-xlsx";

export async function GET(req: Request) {
	try {
		await requireUserId(); // Ensure authenticated
		const { searchParams } = new URL(req.url);

		const fromParam = searchParams.get("from");
		const toParam = searchParams.get("to");
		const assigneeId = searchParams.get("assigneeId");
		const statusId = searchParams.get("statusId");
		const labelSlug = searchParams.get("label");

		// Default range if not provided: -30 to +30 days (generous default for export)
		const now = new Date();
		const from = fromParam
			? new Date(fromParam)
			: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const to = toParam
			? new Date(toParam)
			: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

		// Build Filter (Mirroring /api/tasks logic)
		const where: any = {
			AND: [
				{
					// Start before end of range
					startAt: {
						lt: to,
					},
				},
				{
					// End after start of range OR no end date (ongoing)
					OR: [{ endAt: { gt: from } }, { endAt: null }],
				},
			],
		};

		if (assigneeId) {
			where.assignments = {
				some: { assigneeId },
			};
		}

		if (statusId) {
			where.statusId = statusId;
		}

		if (labelSlug) {
			where.labels = {
				some: {
					label: {
						slug: labelSlug,
					},
				},
			};
		}

		// Fetch Tasks
		const tasks = await prisma.task.findMany({
			where,
			include: {
				status: true,
				assignments: {
					include: {
						assignee: {
							select: { name: true, email: true },
						},
					},
				},
				labels: {
					include: {
						label: {
							select: { name: true, slug: true },
						},
					},
				},
			},
			orderBy: { startAt: "asc" },
			take: 10000, // Safety limit
		});

		// Fetch User Map for Creator/Updater if needed, or just IDs?
		// Requirement says: Created By, Updated By.
		// These are IDs in the Task model. It's friendlier to show names.
		// Let's gather user IDs and fetch them.
		const userIds = new Set<string>();
		tasks.forEach((t) => {
			if (t.createdById) userIds.add(t.createdById);
			if (t.updatedById) userIds.add(t.updatedById);
		});

		const users = await prisma.user.findMany({
			where: { id: { in: Array.from(userIds) } },
			select: { id: true, name: true, email: true },
		});
		const userMap = new Map(users.map((u) => [u.id, u]));

		const formatUser = (uid: string | null) => {
			if (!uid) return "";
			const u = userMap.get(uid);
			return u ? `${u.name} (${u.email})` : uid;
		};

		// Headers
		const headers = [
			"Task ID",
			"Title",
			"Status",
			"Priority",
			"Type",
			"Start At",
			"End At",
			"Duration (min)",
			"All Day",
			"Progress",
			"Assignees",
			"Labels",
			"Color",
			"Created At",
			"Created By",
			"Updated At",
			"Updated By",
		];

		// Rows
		const rows = tasks.map((t) => {
			const assignees = t.assignments
				.map((a) => a.assignee.name)
				.join(", ");
			const labels = t.labels.map((l) => l.label.name).join(", ");

			return [
				t.id,
				t.title,
				t.status.name,
				t.priority,
				t.type,
				t.startAt ? t.startAt.toISOString() : "",
				t.endAt ? t.endAt.toISOString() : "",
				t.durationMin,
				t.allDay ? "Yes" : "No",
				t.progress,
				assignees,
				labels,
				t.color || "",
				t.createdAt.toISOString(),
				formatUser(t.createdById),
				t.updatedAt.toISOString(),
				formatUser(t.updatedById),
			];
		});

		const buffer = xlsx.build([
			{ name: "Tasks", data: [headers, ...rows], options: {} },
		]);

		const filename = `tasks_export_${from.toISOString().split("T")[0]}_${to.toISOString().split("T")[0]}.xlsx`;

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
