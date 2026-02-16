import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId, handleApiError } from "@/lib/task-utils";
import xlsx from "node-xlsx";

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireUserId(); // Ensure authenticated
		const { id: taskId } = await params;
		const { searchParams } = new URL(req.url);

		const format = searchParams.get("format") || "xlsx";
		const fromParam = searchParams.get("from");
		const toParam = searchParams.get("to");

		// Validate Task Existence
		const task = await prisma.task.findUnique({
			where: { id: taskId },
			select: { title: true, id: true },
		});

		if (!task) {
			return NextResponse.json(
				{ ok: false, error: "Task not found" },
				{ status: 404 },
			);
		}

		// Build Filter
		const where: any = {
			taskId,
		};
		if (fromParam) {
			where.at = {
				...where.at,
				gte: new Date(fromParam),
			};
		}
		if (toParam) {
			where.at = {
				...where.at,
				lte: new Date(toParam),
			};
		}

		// Fetch Audits
		// Limit to 10k rows for performance safety
		const audits = await prisma.taskAuditTrail.findMany({
			where,
			orderBy: { at: "desc" },
			take: 10000,
		});

		// --- 1. PREPARE REFERENCE DATA ---

		// A. Collect User IDs (actors + assignees in data)
		const userIds = new Set<string>();
		const statusIds = new Set<string>();

		audits.forEach((audit) => {
			if (audit.byUserId) userIds.add(audit.byUserId);

			const data = audit.data as any;
			if (!data) return;

			// Check for assignments
			if (data.addedIds && Array.isArray(data.addedIds)) {
				data.addedIds.forEach((uid: string) => userIds.add(uid));
			}
			if (data.removedIds && Array.isArray(data.removedIds)) {
				data.removedIds.forEach((uid: string) => userIds.add(uid));
			}
			if (data.assigneeIds && Array.isArray(data.assigneeIds)) {
				// From CREATE snapshot
				data.assigneeIds.forEach((uid: string) => userIds.add(uid));
			}

			// Check for status changes
			if (audit.action === "STATUS_CHANGE") {
				if (data.from) statusIds.add(data.from);
				if (data.to) statusIds.add(data.to);
			}
			// Check for CREATE status
			if (audit.action === "CREATE" && data.statusId) {
				statusIds.add(data.statusId);
			}
		});

		// B. Fetch Users
		const users = await prisma.user.findMany({
			where: { id: { in: Array.from(userIds) } },
			select: { id: true, name: true, email: true },
		});
		const userMap = new Map(users.map((u) => [u.id, u]));

		// C. Fetch Statuses
		const statuses = await prisma.taskStatus.findMany({
			where: { id: { in: Array.from(statusIds) } },
			select: { id: true, name: true },
		});
		const statusMap = new Map(statuses.map((s) => [s.id, s.name]));

		// --- 2. HELPERS ---

		const formatUser = (uid: string) => {
			const u = userMap.get(uid);
			return u ? `${u.name} (${u.email})` : uid || "Unknown";
		};

		const formatUserNameOnly = (uid: string) => {
			const u = userMap.get(uid);
			return u ? u.name : uid || "Unknown";
		};

		const formatStatus = (sid: string) => {
			return statusMap.get(sid) || sid || "Unknown";
		};

		const generateChangesSummary = (audit: (typeof audits)[0]) => {
			const data = audit.data as any;
			if (!data) return "";

			switch (audit.action) {
				case "CREATE":
					return "Task Created";
				case "STATUS_CHANGE":
					return `Status: ${formatStatus(data.from)} → ${formatStatus(data.to)}`;
				case "ASSIGN":
					const added = data.addedIds
						? data.addedIds.map(formatUserNameOnly).join(", ")
						: "";
					return `Assigned to: ${added}`;
				case "UNASSIGN":
					const removed = data.removedIds
						? data.removedIds.map(formatUserNameOnly).join(", ")
						: "";
					return `Unassigned: ${removed}`;
				case "COMMENT":
					// 'data' for COMMENT might not be standardized in audit,
					// usually comment body is in message or fetched separately?
					// Model says `message` String?.
					// Checking TaskComment model, it tracks its own history?
					// Or do we create Audit for comments?
					// Schema says TaskAuditAction.COMMENT exists.
					// If data is null, maybe just "Comment added".
					return data.body
						? `Comment: "${data.body}"`
						: "Comment added";
				case "UPDATE":
					// data is { field: { from, to }, key: val... }
					// We need to robustly parse this.
					const changes: string[] = [];
					for (const [key, val] of Object.entries(data)) {
						if (key === "labels") {
							const labelsObj = val as any;
							// labels: { from: [], to: [] }
							const from = Array.isArray(labelsObj.from)
								? labelsObj.from.join(", ")
								: "";
							const to = Array.isArray(labelsObj.to)
								? labelsObj.to.join(", ")
								: "";
							changes.push(`Labels: [${from}] → [${to}]`);
						} else if (
							typeof val === "object" &&
							val !== null &&
							"from" in val &&
							"to" in val
						) {
							const v = val as any;
							let fromStr = String(v.from);
							let toStr = String(v.to);
							// Handle dates if possible (simple heuristic)
							if (key.endsWith("At") || key.endsWith("Date")) {
								try {
									fromStr = v.from
										? new Date(v.from).toLocaleString()
										: "None";
									toStr = v.to
										? new Date(v.to).toLocaleString()
										: "None";
								} catch (e) {}
							}
							changes.push(`${key}: ${fromStr} → ${toStr}`);
						} else {
							// fallback
							changes.push(`${key} changed`);
						}
					}
					return changes.join("; ");
				case "DELETE":
					return "Task Deleted";
				default:
					return JSON.stringify(data);
			}
		};

		// --- 3. BUILD ROWS ---

		// Headers
		const headers = [
			"At (Local)",
			"At (ISO)",
			"Actor",
			"Actor Email",
			"Action",
			"Task ID",
			"Task Title",
			"Message",
			"Changes Summary",
			"Raw Data",
		];

		const rows = audits.map((a) => {
			const actor = userMap.get(a.byUserId || "") || {
				name: "System",
				email: "",
			};
			const at = new Date(a.at);

			return [
				at.toLocaleString(), // Local time approximation (server time)
				at.toISOString(),
				actor.name,
				actor.email,
				a.action,
				task.id,
				task.title,
				a.message || "",
				generateChangesSummary(a),
				JSON.stringify(a.data || {}),
			];
		});

		// Sheet 1: Audit Logs
		const sheet1Data = [headers, ...rows];

		// Sheet 2: Raw JSON (Full Dump)
		const sheet2Data = [
			["ID", "Full JSON"],
			...audits.map((a) => [a.id, JSON.stringify(a, null, 2)]),
		];

		// --- 4. GENERATE EXCEL ---

		const buffer = xlsx.build([
			{ name: "Audit Logs", data: sheet1Data, options: {} },
			{ name: "Raw Data", data: sheet2Data, options: {} },
		]);

		// --- 5. RETURN RESPONSE ---

		const filename = `task-audits-${taskId}-${new Date().toISOString().split("T")[0]}.xlsx`;

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
