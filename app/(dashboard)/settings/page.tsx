"use client";

import { useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type NotificationKey = "product" | "security" | "weekly" | "beta";

const NOTIFICATION_OPTIONS: Array<{
	key: NotificationKey;
	title: string;
	description: string;
}> = [
	{
		key: "product",
		title: "Product updates",
		description:
			"Announcements about new releases and feature improvements.",
	},
	{
		key: "security",
		title: "Security alerts",
		description:
			"Sign-in attempts, password resets, and sensitive changes.",
	},
	{
		key: "weekly",
		title: "Weekly reports",
		description:
			"Usage recaps and adoption insights delivered every Monday.",
	},
	{
		key: "beta",
		title: "Beta programs",
		description: "Early access invites for experimental tooling.",
	},
];

const TIMEZONES = [
	{ label: "(UTC -08:00) Pacific Time", value: "pst" },
	{ label: "(UTC -05:00) Eastern Time", value: "est" },
	{ label: "(UTC +00:00) Coordinated Universal Time", value: "utc" },
	{ label: "(UTC +01:00) Central European Time", value: "cet" },
];

const TEAM_ROLES = [
	{ team: "Platform", role: "Owner", seats: 12 },
	{ team: "Marketing", role: "Admin", seats: 5 },
	{ team: "Finance", role: "Viewer", seats: 3 },
];

type ApiToken = {
	id: string;
	label: string;
	lastUsed: string;
	scope: "Read" | "Write" | "Full access";
	active: boolean;
};

export default function SettingsPage() {
	const [fullName, setFullName] = useState("Taylor Livingston");
	const [title, setTitle] = useState("Director of Operations");
	const [email, setEmail] = useState("taylor@solstice.io");
	const [timezone, setTimezone] = useState("utc");
	const [notifications, setNotifications] = useState<
		Record<NotificationKey, boolean>
	>({
		product: true,
		security: true,
		weekly: false,
		beta: false,
	});
	const [apiTokens, setApiTokens] = useState<ApiToken[]>([
		{
			id: "tok_1423",
			label: "Internal dashboard",
			lastUsed: "12 minutes ago",
			scope: "Full access",
			active: true,
		},
		{
			id: "tok_1309",
			label: "Zapier automation",
			lastUsed: "3 days ago",
			scope: "Write",
			active: true,
		},
		{
			id: "tok_1022",
			label: "Legacy partner",
			lastUsed: "Sep 19, 2024",
			scope: "Read",
			active: false,
		},
	]);
	const [newTokenLabel, setNewTokenLabel] = useState("");
	const maskedEmail = useMemo(() => {
		const [user, domain] = email.split("@");
		if (!user || !domain) return email;
		const visible = user.slice(0, 2);
		return `${visible}${"*".repeat(
			Math.max(user.length - 2, 0)
		)}@${domain}`;
	}, [email]);

	const handleToggleNotification = (key: NotificationKey) => {
		setNotifications((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const handleCreateToken = () => {
		if (!newTokenLabel.trim()) return;
		const id = crypto.randomUUID().slice(0, 8);
		setApiTokens((prev) => [
			{
				id: `tok_${id}`,
				label: newTokenLabel.trim(),
				lastUsed: "Never",
				scope: "Read",
				active: true,
			},
			...prev,
		]);
		setNewTokenLabel("");
	};

	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold">Settings</h1>
				<p className="text-muted-foreground">
					Update your profile, manage notifications, and control API
					access.
				</p>
			</header>

			<div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
				<section className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Profile</CardTitle>
							<CardDescription>
								Public information shared with teammates.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="fullName">Full name</Label>
									<Input
										id="fullName"
										value={fullName}
										onChange={(event) =>
											setFullName(event.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="title">Title</Label>
									<Input
										id="title"
										value={title}
										onChange={(event) =>
											setTitle(event.target.value)
										}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Work email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(event) =>
										setEmail(event.target.value)
									}
								/>
								<p className="text-xs text-muted-foreground">
									This email is used for authentication and
									alerts ({maskedEmail}).
								</p>
							</div>
							<div className="space-y-2">
								<Label>Timezone</Label>
								<Select
									value={timezone}
									onValueChange={setTimezone}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select timezone" />
									</SelectTrigger>
									<SelectContent>
										{TIMEZONES.map((zone) => (
											<SelectItem
												key={zone.value}
												value={zone.value}
											>
												{zone.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex justify-end gap-3">
								<Button variant="outline">Cancel</Button>
								<Button>Save changes</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Notifications</CardTitle>
							<CardDescription>
								Pick which updates land in your inbox.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{NOTIFICATION_OPTIONS.map((option) => {
								const enabled = notifications[option.key];
								return (
									<div
										key={option.key}
										className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
									>
										<div>
											<p className="font-medium">
												{option.title}
											</p>
											<p className="text-sm text-muted-foreground">
												{option.description}
											</p>
										</div>
										<Button
											variant={
												enabled ? "default" : "outline"
											}
											className="w-full sm:w-auto"
											onClick={() =>
												handleToggleNotification(
													option.key
												)
											}
										>
											{enabled ? "Enabled" : "Disabled"}
										</Button>
									</div>
								);
							})}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>API tokens</CardTitle>
							<CardDescription>
								Rotate credentials to keep integrations secure.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-col gap-3 sm:flex-row">
								<Input
									placeholder="Label e.g. Zapier sync"
									value={newTokenLabel}
									onChange={(event) =>
										setNewTokenLabel(event.target.value)
									}
								/>
								<Button onClick={handleCreateToken}>
									Generate token
								</Button>
							</div>

							<div className="space-y-3">
								{apiTokens.map((token) => (
									<div
										key={token.id}
										className="rounded-xl border p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
									>
										<div>
											<p className="font-medium">
												{token.label}
											</p>
											<p className="text-sm text-muted-foreground">
												{token.scope} · Last used{" "}
												{token.lastUsed}
											</p>
										</div>
										<div className="flex gap-2">
											<Button variant="outline">
												Copy ID
											</Button>
											<Button
												variant={
													token.active
														? "ghost"
														: "outline"
												}
											>
												{token.active
													? "Disable"
													: "Restore"}
											</Button>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</section>

				<aside className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Teams &amp; roles</CardTitle>
							<CardDescription>
								Membership across workspaces.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{TEAM_ROLES.map((team) => (
								<div
									key={team.team}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div>
										<p className="font-medium">
											{team.team}
										</p>
										<p className="text-xs text-muted-foreground">
											{team.role} · {team.seats} seats
										</p>
									</div>
									<Button variant="outline" size="sm">
										Manage
									</Button>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Security</CardTitle>
							<CardDescription>
								Reinforce your account safety.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-xl border p-4 space-y-2">
								<p className="font-medium">
									Two-factor authentication
								</p>
								<p className="text-sm text-muted-foreground">
									Protect logins with a hardware key or
									authenticator app.
								</p>
								<Button className="w-full">Enable 2FA</Button>
							</div>
							<div className="rounded-xl border p-4 space-y-2">
								<p className="font-medium">Active sessions</p>
								<p className="text-sm text-muted-foreground">
									Last activity from Chrome · San Francisco ·
									2 minutes ago.
								</p>
								<Button variant="outline" className="w-full">
									Sign out of other devices
								</Button>
							</div>
						</CardContent>
					</Card>
				</aside>
			</div>
		</div>
	);
}

