import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function getUserRolesAndPermissions(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			roles: {
				include: {
					permissions: true,
				},
			},
		},
	});

	if (!user) return { roles: [], permissions: [] };

	const roles = user.roles.map((r: any) => r.name);
	const permissions = new Set(
		user.roles.flatMap((r: any) =>
			r.permissions.map((p: any) => `${p.action}:${p.resource}`),
		),
	);

	return { roles, permissions: Array.from(permissions) };
}

type PermissionOptions = {
	bypassOwnership?: boolean;
	ownerIds?: (string | null | undefined)[];
};

export async function hasPermission(
	action: string,
	resource: string,
	options?: PermissionOptions,
) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) return false;

	const userId = session.user.id;
	// console.log("userid", userId);

	const { roles, permissions } = await getUserRolesAndPermissions(
		session.user.id,
	);

	// Superadmin bypass
	if (roles.includes("superadmin")) {
		return true;
	}

	const requiredPermission = `${action}:${resource}`;

	// Bypass based on explicit owner IDs
	if (options?.bypassOwnership && options.ownerIds) {
		// console.log("ownerId", options.ownerIds);
		if (options.ownerIds.includes(userId)) {
			return true;
		}
	}

	return (
		permissions.includes(requiredPermission) ||
		permissions.includes("manage:all")
	);
}

export async function hasRole(role: string) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) return false;

	const { roles } = await getUserRolesAndPermissions(session.user.id);
	return roles.includes(role);
}
