import { hasPermission } from "@/lib/rbac";
import { rawMenu } from "./raw-menu";

type Permission = {
	resource: string;
	action: "read" | "create" | "update" | "delete" | "manage";
};

type MenuItem = {
	name: string;
	href: string;
	icon?: any;
	permissions?: Permission[];
	children?: MenuItem[];
};

function flattenMenu(items: MenuItem[]): MenuItem[] {
	const out: MenuItem[] = [];
	for (const it of items) {
		out.push(it);
		if (it.children?.length) out.push(...flattenMenu(it.children));
	}
	return out;
}

async function isAllowed(perms?: Permission[]) {
	// No permissions => treat as public
	if (!perms || perms.length === 0) return true;

	// Require ALL permissions listed on the item
	for (const p of perms) {
		const ok = await hasPermission(p.action, p.resource);
		if (!ok) return false;
	}
	return true;
}

/**
 * Picks first accessible menu href following your sidebar order.
 * - Tries everything except /help first
 * - Falls back to /help
 */
export async function getPostLoginHref(): Promise<string> {
	const flat = flattenMenu(rawMenu as MenuItem[]);

	// Try all items (in order) except help
	for (const item of flat) {
		if (!item?.href) continue;
		if (item.href === "/help") continue;

		if (await isAllowed(item.permissions)) {
			return item.href;
		}
	}

	// Last resort
	return "/help";
}
