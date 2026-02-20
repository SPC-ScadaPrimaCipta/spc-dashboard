import {
	LayoutDashboard,
	Settings,
	User,
	UserCircle,
	ShieldCheck,
	Inbox,
	GitBranch,
	UserCheck,
	HeartPulse,
	FileSearch,
	HelpCircle,
	FileText,
	Calendar,
	Server,
} from "lucide-react";

export type MenuItem = {
	name: string;
	href: string;
	icon: any;
	permissions?: {
		resource: string;
		action: "read" | "create" | "update" | "delete" | "manage";
	}[];
	children?: MenuItem[];
};

export const rawMenu: MenuItem[] = [
	{
		name: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		permissions: [{ resource: "dashboard", action: "read" }],
	},

	{
		name: "Schedule",
		href: "/schedule",
		icon: Calendar,
		permissions: [{ resource: "schedules", action: "read" }],
	},
	{
		name: "Resources",
		href: "/resources",
		icon: Server,
		permissions: [{ resource: "resources", action: "read" }],
	},
	{
		name: "Proposals",
		href: "/proposals",
		icon: FileText,
		permissions: [{ resource: "proposals", action: "read" }],
	},
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
		name: "Workflow",
		href: "/workflow",
		icon: GitBranch,
		children: [
			{
				name: "Inbox",
				href: "/workflow/inbox",
				icon: Inbox,
				permissions: [{ resource: "workflows", action: "read" }],
			},
			{
				name: "My Requests",
				href: "/workflow/requests",
				icon: UserCheck,
				permissions: [{ resource: "workflows", action: "read" }],
			},
			{
				name: "Manage Workflow",
				href: "/workflow/manage",
				icon: Settings,
				permissions: [{ resource: "workflows", action: "read" }],
			},
			{
				name: "Monitoring",
				href: "/workflow/monitoring",
				icon: HeartPulse,
				permissions: [{ resource: "roles", action: "read" }],
			},
			{
				name: "Audit",
				href: "/workflow/audit",
				icon: FileSearch,
				permissions: [{ resource: "roles", action: "read" }],
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
			// { name: "Appearance", href: "/settings/appearance", icon: Palette },
			// { name: "Billing", href: "/settings/billing", icon: CreditCard },
		],
	},

	{
		name: "Help",
		href: "/help",
		icon: HelpCircle,
	},
];
