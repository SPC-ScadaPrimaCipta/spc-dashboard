import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireUserId(): Promise<string> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) {
		throw new Error("Unauthorized");
	}
	return session.user.id;
}

export async function requireAdmin(): Promise<string> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const roles = (session.user as any).roles || [];
	if (!roles.includes("admin") && !roles.includes("superadmin")) {
		throw new Error("Forbidden");
	}
	return session.user.id;
}

export function slugify(text: string): string {
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/[\s\W-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function handleApiError(error: any) {
	console.error(error);
	if (error.message === "Unauthorized") {
		return NextResponse.json(
			{ ok: false, error: "Unauthorized" },
			{ status: 401 },
		);
	}
	if (error.message === "Forbidden") {
		return NextResponse.json(
			{ ok: false, error: "Forbidden" },
			{ status: 403 },
		);
	}
	if (error instanceof Error) {
		return NextResponse.json(
			{ ok: false, error: error.message },
			{ status: 400 },
		);
	}
	return NextResponse.json(
		{ ok: false, error: "Internal Server Error" },
		{ status: 500 },
	);
}

export function buildAuditDiff(
	oldData: Record<string, any>,
	newData: Record<string, any>,
): Record<string, { from: any; to: any }> | null {
	const diff: Record<string, { from: any; to: any }> = {};
	let hasChanges = false;

	const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

	for (const key of allKeys) {
		const val1 = oldData[key];
		const val2 = newData[key];

		// Simple strict equality check. Warning: Date objects need special handling if not serialized
		if (val1 !== val2) {
			// Check if dates are equal logic
			if (
				val1 instanceof Date &&
				val2 instanceof Date &&
				val1.getTime() === val2.getTime()
			) {
				continue;
			}
			// Check if null and undefined are treated same? No, usually distinct in Prisma, but for API updates maybe treating null/undefined carefully.
			// Ignoring undefined in newData if it implies "no change".
			// But typically we pass clean objects here.
			if (val2 === undefined) continue;

			diff[key] = { from: val1, to: val2 };
			hasChanges = true;
		}
	}

	return hasChanges ? diff : null;
}
