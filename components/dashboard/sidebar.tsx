"use client";

import { useSidebar } from "./sidebar-context";
import {
	LayoutDashboard,
	Settings,
	RocketIcon,
	User,
	ChevronDown,
	ChevronRight,
	UserCircle,
	ShieldCheck,
	Palette,
	CreditCard,
} from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { authClient } from "@/lib/auth-client";

type MenuItem = {
	name: string;
	href: string;
	icon: any;
	permissions?: {
		resource: string;
		action: "read" | "create" | "update" | "delete" | "manage";
	}[];
	children?: MenuItem[];
};

const rawMenu: MenuItem[] = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{
		name: "Admin",
		href: "/admin",
		icon: ShieldCheck,
		children: [
			{
				name: "Users",
				href: "/admin/users",
				icon: User,
				permissions: [{ resource: "users", action: "read" }],
			},
			{
				name: "Roles",
				href: "/admin/roles",
				icon: UserCircle,
				permissions: [{ resource: "roles", action: "read" }],
			},
			{
				name: "Permissions",
				href: "/admin/permissions",
				icon: ShieldCheck,
				permissions: [{ resource: "permissions", action: "read" }],
			},
		],
	},
	{
		name: "Settings",
		href: "/settings",
		icon: Settings,
		children: [
			{ name: "Profile", href: "/settings/profile", icon: UserCircle },
			{
				name: "Account Security",
				href: "/settings/security",
				icon: ShieldCheck,
			},
			{ name: "Appearance", href: "/settings/appearance", icon: Palette },
			{ name: "Billing", href: "/settings/billing", icon: CreditCard },
		],
	},
];

export function Sidebar() {
	const { collapsed, setCollapsed } = useSidebar();
	const sidebarRef = useRef<HTMLDivElement | null>(null);
	const pathname = usePathname();
	const { data: session } = authClient.useSession();

	function isActive(href: string) {
		return pathname === href || pathname.startsWith(href + "/");
	}

	const menu = useMemo(() => {
		const userPermissions = new Set<string>(
			(session?.user as any)?.permissions || []
		);

		// Helper to check if user has ALL required permissions for an item
		const hasAccess = (
			required?: { resource: string; action: string }[]
		) => {
			if (!required || required.length === 0) return true;

			// Superadmin bypass: "manage:all" grants access to everything
			if (userPermissions.has("manage:all")) return true;

			// For "manage", check if we have the specific permission OR if we are admin/superadmin
			// Although typically better-auth permissions are explicit.
			// We'll check for explicit permission "action:resource"
			return required.every((p) =>
				userPermissions.has(`${p.action}:${p.resource}`)
			);
		};

		const filterItems = (items: MenuItem[]): MenuItem[] => {
			return items
				.map((item) => {
					// Check children first
					if (item.children) {
						const visibleChildren = filterItems(item.children);
						if (visibleChildren.length > 0) {
							return { ...item, children: visibleChildren };
						}
						// If parent has specific permissions, check them even if children are empty?
						// Usually if it's a section header like "Admin", we hide it if no children.
						// If it's a clickable page that also has sub-pages, we might keep it.
						// Here "Admin" is just a grouper.
						return null;
					}

					// Leaf node
					if (hasAccess(item.permissions)) {
						return item;
					}
					return null;
				})
				.filter((item) => item !== null) as MenuItem[];
		};

		return filterItems(rawMenu);
	}, [session]);

	// Manage which accordion is open
	const [openMenu, setOpenMenu] = useState<string | null>(null);

	// Auto-expand menu based on URL
	useEffect(() => {
		const parent = menu.find((m) =>
			m.children?.some(
				(c) => pathname === c.href || pathname.startsWith(c.href + "/")
			)
		);

		if (parent) {
			setOpenMenu(parent.href);
		}
	}, [pathname, menu]);

	// Close on mobile
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			const sidebar = sidebarRef.current;
			const isMobile = window.innerWidth < 768;
			if (
				isMobile &&
				sidebar &&
				!sidebar.contains(e.target as Node) &&
				!collapsed
			) {
				setCollapsed(true);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, [collapsed, setCollapsed]);

	return (
		<div
			ref={sidebarRef}
			className={`
				flex flex-col border-r bg-white dark:bg-neutral-900
				fixed md:static z-50
				transition-all duration-300 ease-in-out
				${collapsed ? "w-20" : "w-64"}
				${collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"}
				left-0 top-0
				h-dvh md:h-screen
				min-h-0
				overflow-hidden
    `}
		>
			{/* HEADER */}
			<nav className="px-2">
				<div className="flex items-center min-h-16 gap-3 px-6 py-2 rounded-md text-sm">
					<RocketIcon size={24} className="shrink-0" />

					<span
						className={`
              font-bold text-lg whitespace-nowrap overflow-hidden
              transition-all duration-300
              ${collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"}
            `}
					>
						Dashboard
					</span>
				</div>
			</nav>

			{/* MENU */}
			<nav className="flex-1 overflow-y-auto min-h-0 px-2 space-y-1 mt-3">
				{menu.map((m) => {
					const Icon = m.icon;

					// --------------------
					// MENU WITH CHILDREN
					// --------------------
					if (m.children) {
						const menuOpen = openMenu === m.href;
						const isChildActive = m.children.some((child) =>
							isActive(child.href)
						);

						return (
							<div key={m.href}>
								<button
									onClick={() =>
										setOpenMenu(menuOpen ? null : m.href)
									}
									className={`
                    w-full flex items-center gap-3 px-6 py-2 rounded-md text-sm
                    transition-all duration-300 hover:bg-muted
                    ${
						isChildActive
							? "text-primary font-medium"
							: isActive(m.href)
							? "bg-muted text-primary font-medium "
							: "text-muted-foreground hover:bg-muted"
					}
                  `}
								>
									<Icon size={18} className="shrink-0" />

									<span
										className={`
                      whitespace-nowrap overflow-hidden transition-all duration-300
                      ${
							collapsed
								? "opacity-0 max-w-0"
								: "opacity-100 max-w-[200px]"
						}
                    `}
									>
										{m.name}
									</span>

									{!collapsed && (
										<span className="ml-auto">
											<ChevronRight
												size={16}
												className={`transition-transform duration-200 ${
													menuOpen ? "rotate-90" : ""
												}`}
											/>
										</span>
									)}
								</button>

								{/* SUBMENU */}
								{!collapsed && (
									<div
										className={`
                      overflow-hidden transition-all duration-300 ml-10
                      ${menuOpen ? "max-h-96" : "max-h-0"}
                    `}
									>
										{m.children.map((sub) => {
											const SubIcon = sub.icon;

											return (
												<Link
													key={sub.href}
													href={sub.href}
													className={`
                            flex items-center gap-2 px-4 py-2 rounded-md text-sm my-2
                            ${
								isActive(sub.href)
									? "text-primary font-medium bg-muted"
									: "text-muted-foreground hover:bg-muted"
							}
                          `}
												>
													<SubIcon
														size={15}
														className="shrink-0"
													/>
													{sub.name}
												</Link>
											);
										})}
									</div>
								)}
							</div>
						);
					}

					// --------------------
					// NORMAL MENU ITEM
					// --------------------
					return (
						<Link
							key={m.href}
							href={m.href}
							className={`
                flex items-center gap-3 px-6 py-2 rounded-md text-sm hover:bg-muted
                transition-all duration-300
                ${
					isActive(m.href)
						? "bg-muted text-primary font-medium"
						: "text-muted-foreground hover:bg-muted"
				}
                relative
              `}
						>
							{isActive(m.href) && (
								<span className="absolute left-0 top-0 h-full w-1 bg-primary rounded-full" />
							)}

							<Icon size={18} className="shrink-0" />

							<span
								className={`
                  whitespace-nowrap overflow-hidden transition-all duration-300
                  ${
						collapsed
							? "opacity-0 max-w-0"
							: "opacity-100 max-w-[200px]"
					}
                `}
							>
								{m.name}
							</span>
						</Link>
					);
				})}
			</nav>

			{/* FOOTER */}
			<div className="p-4 border-t shrink-0">
				{collapsed ? <LogoutButton iconOnly /> : <LogoutButton />}
			</div>
		</div>
	);
}
