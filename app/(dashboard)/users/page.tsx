"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BadgeCheck, MailPlus, MoreVertical, Plus, Shield } from "lucide-react";

type UserStatus = "Active" | "Invited" | "Suspended";
type UserRole = "Admin" | "Manager" | "Editor" | "Viewer";

const MOCK_USERS: Array<{
	id: string;
	name: string;
	email: string;
	role: UserRole;
	status: UserStatus;
	team: string;
	lastActive: string;
}> = [
	{
		id: "USR-2048",
		name: "Ava Craig",
		email: "ava.craig@solstice.io",
		role: "Admin",
		status: "Active",
		team: "Product",
		lastActive: "2 minutes ago",
	},
	{
		id: "USR-2051",
		name: "Myles Norris",
		email: "myles.norris@solstice.io",
		role: "Manager",
		status: "Active",
		team: "Sales",
		lastActive: "45 minutes ago",
	},
	{
		id: "USR-2099",
		name: "Veronica Patel",
		email: "veronica.patel@solstice.io",
		role: "Editor",
		status: "Suspended",
		team: "Content",
		lastActive: "3 days ago",
	},
	{
		id: "USR-2110",
		name: "Henry Park",
		email: "henry.park@solstice.io",
		role: "Viewer",
		status: "Invited",
		team: "Finance",
		lastActive: "Pending invite",
	},
	{
		id: "USR-2142",
		name: "Summer Tran",
		email: "summer.tran@solstice.io",
		role: "Editor",
		status: "Active",
		team: "Marketing",
		lastActive: "12 hours ago",
	},
	{
		id: "USR-2183",
		name: "Isaac Holloway",
		email: "isaac.holloway@solstice.io",
		role: "Manager",
		status: "Active",
		team: "Customer Success",
		lastActive: "7 minutes ago",
	},
];

const STATUS_STYLES: Record<UserStatus, string> = {
	Active: "text-emerald-600 bg-emerald-100/80 dark:text-emerald-300 dark:bg-emerald-500/15",
	Invited:
		"text-amber-600 bg-amber-100/70 dark:text-amber-300 dark:bg-amber-500/10",
	Suspended:
		"text-rose-600 bg-rose-100/80 dark:text-rose-300 dark:bg-rose-500/15",
};

const ROLES: UserRole[] = ["Admin", "Manager", "Editor", "Viewer"];

export default function UsersPage() {
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const filteredUsers = useMemo(() => {
		return MOCK_USERS.filter((user) => {
			const matchesSearch =
				!search ||
				user.name.toLowerCase().includes(search.toLowerCase()) ||
				user.email.toLowerCase().includes(search.toLowerCase()) ||
				user.id.toLowerCase().includes(search.toLowerCase());

			const matchesRole =
				roleFilter === "all" || user.role.toLowerCase() === roleFilter;
			const matchesStatus =
				statusFilter === "all" ||
				user.status.toLowerCase() === statusFilter;

			return matchesSearch && matchesRole && matchesStatus;
		});
	}, [search, roleFilter, statusFilter]);

	const activeUsers = MOCK_USERS.filter(
		(user) => user.status === "Active"
	).length;
	const pendingInvites = MOCK_USERS.filter(
		(user) => user.status === "Invited"
	).length;

	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Users</h1>
					<p className="text-muted-foreground">
						Manage roles, invitations, and account access.
					</p>
				</div>

				<div className="flex gap-2">
					<Button variant="outline" className="gap-2">
						<Shield className="size-4" />
						Access policies
					</Button>
					<Button className="gap-2">
						<Plus className="size-4" />
						Invite user
					</Button>
				</div>
			</header>

			<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total members
						</CardTitle>
						<CardDescription className="text-3xl font-semibold text-foreground">
							{MOCK_USERS.length}
						</CardDescription>
					</CardHeader>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Active users
							</CardTitle>
							<p className="text-3xl font-semibold">
								{activeUsers}
							</p>
						</div>
						<BadgeCheck className="text-emerald-500 size-8" />
					</CardHeader>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Pending invites
							</CardTitle>
							<p className="text-3xl font-semibold">
								{pendingInvites}
							</p>
						</div>
						<MailPlus className="text-amber-500 size-8" />
					</CardHeader>
				</Card>
			</section>

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
					<CardDescription>
						Use quick filters to narrow down large teams.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="search">Search</Label>
							<Input
								id="search"
								placeholder="Name, email, or ID"
								value={search}
								onChange={(event) =>
									setSearch(event.target.value)
								}
							/>
						</div>

						<div className="space-y-2">
							<Label>Role</Label>
							<Select
								value={roleFilter}
								onValueChange={setRoleFilter}
							>
								<SelectTrigger>
									<SelectValue placeholder="All roles" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All roles
									</SelectItem>
									{ROLES.map((role) => (
										<SelectItem
											key={role}
											value={role.toLowerCase()}
										>
											{role}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Status</Label>
							<Select
								value={statusFilter}
								onValueChange={setStatusFilter}
							>
								<SelectTrigger>
									<SelectValue placeholder="All statuses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All statuses
									</SelectItem>
									{(
										Object.keys(
											STATUS_STYLES
										) as UserStatus[]
									).map((status) => (
										<SelectItem
											key={status}
											value={status.toLowerCase()}
										>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Team directory</CardTitle>
						<CardDescription>
							{filteredUsers.length} member
							{filteredUsers.length === 1 ? "" : "s"} match the
							current filters.
						</CardDescription>
					</div>
					<Button variant="outline" className="gap-2">
						<Plus className="size-4" />
						Bulk invite
					</Button>
				</CardHeader>
				<CardContent className="px-0">
					<div className="px-6">
						<div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b pb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
							<span>User</span>
							<span>Role &amp; team</span>
							<span>Status</span>
							<span className="sr-only">Row actions</span>
						</div>
					</div>

					<ul className="divide-y">
						{filteredUsers.map((user) => (
							<li
								key={user.id}
								className="px-6 py-4 grid items-center gap-4 grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
							>
								<div className="flex items-center gap-3">
									<Avatar>
										<AvatarFallback>
											{user.name
												.split(" ")
												.map((part) => part[0])
												.join("")
												.slice(0, 2)
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="font-medium leading-tight">
											{user.name}
										</p>
										<p className="text-muted-foreground text-sm">
											{user.email}
										</p>
										<p className="text-muted-foreground text-xs">
											{user.id}
										</p>
									</div>
								</div>

								<div>
									<p className="text-sm font-medium">
										{user.role}
									</p>
									<p className="text-muted-foreground text-xs">
										{user.team}
									</p>
								</div>

								<div className="flex flex-col gap-1">
									<span
										className={`inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-medium ${
											STATUS_STYLES[user.status]
										}`}
									>
										{user.status}
									</span>
									<span className="text-muted-foreground text-xs">
										{user.lastActive}
									</span>
								</div>

								<div className="flex justify-end">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
											>
												<MoreVertical className="size-4" />
												<span className="sr-only">
													Open menu
												</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuLabel>
												Manage
											</DropdownMenuLabel>
											<DropdownMenuItem>
												Edit details
											</DropdownMenuItem>
											<DropdownMenuItem>
												Change role
											</DropdownMenuItem>
											<DropdownMenuItem>
												Resend invitation
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem variant="destructive">
												Revoke access
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</li>
						))}
					</ul>

					{filteredUsers.length === 0 && (
						<div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-muted-foreground">
							<p className="text-sm font-medium">
								No users found
							</p>
							<p className="text-sm">
								Adjust your filters or invite a new teammate.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

