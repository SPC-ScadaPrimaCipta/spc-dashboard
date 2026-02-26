"use client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useRequirePermission } from "@/hooks/use-require-permission";

const KPI = [
	{ label: "Monthly Recurring Revenue", value: "$82.4K", delta: "+12.4%" },
	{ label: "Active Subscriptions", value: "5,983", delta: "+4.1%" },
	{ label: "Support Tickets", value: "126", delta: "-9.2%" },
	{ label: "Avg. Response Time", value: "2m 14s", delta: "-32%" },
];

const REVENUE_TREND = [
	{ label: "Mon", value: 48 },
	{ label: "Tue", value: 62 },
	{ label: "Wed", value: 52 },
	{ label: "Thu", value: 74 },
	{ label: "Fri", value: 68 },
	{ label: "Sat", value: 44 },
	{ label: "Sun", value: 38 },
];

const PIPELINE = [
	{
		company: "Pulse Analytics",
		owner: "Danika Wu",
		value: "$28,400",
		stage: "Contract review",
	},
	{
		company: "Northwind Retail",
		owner: "Marco Reyes",
		value: "$16,900",
		stage: "Proposal sent",
	},
	{
		company: "Quill Systems",
		owner: "Gabrielle Lee",
		value: "$11,250",
		stage: "Demo scheduled",
	},
	{
		company: "Atlas Manufacturing",
		owner: "Cedric Ruiz",
		value: "$45,700",
		stage: "Final approval",
	},
];

const ACTIVITY = [
	{
		id: "ACT-1024",
		team: "Design Systems",
		status: "Released",
		summary: "v3 foundations published",
	},
	{
		id: "ACT-1061",
		team: "Marketing Ops",
		status: "Blocked",
		summary: "Attribution export for Q1",
	},
	{
		id: "ACT-1088",
		team: "Billing",
		status: "On track",
		summary: "Automated renewals rollout",
	},
];

export default function DashboardPage() {
	const { isAuthorized, isLoading: authLoading } = useRequirePermission(
		"read",
		"dashboard",
	);

	if (!isAuthorized) {
		return null; // Redirecting...
	}
	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Dashboard</h1>
					<p className="text-muted-foreground">
						Key revenue, retention, and operational signals for this
						week.
					</p>
				</div>
				<div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row">
					<Select defaultValue="7d">
						<SelectTrigger className="w-full sm:w-32">
							<SelectValue placeholder="Range" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">Last 7 days</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="90d">Last 90 days</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline" className="w-full sm:w-auto">
						Download report
					</Button>
					<Button className="w-full sm:w-auto">Share snapshot</Button>
				</div>
			</header>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{KPI.map((item) => (
					<Card key={item.label}>
						<CardHeader>
							<CardDescription>{item.label}</CardDescription>
							<CardTitle className="text-3xl">
								{item.value}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p
								className={`text-sm font-medium ${
									item.delta.startsWith("-")
										? "text-red-500"
										: "text-emerald-500"
								}`}
							>
								{item.delta} vs last period
							</p>
						</CardContent>
					</Card>
				))}
			</section>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Revenue trend</CardTitle>
							<CardDescription>
								Weekly recurring revenue by day.
							</CardDescription>
						</div>
						<Select defaultValue="recurring">
							<SelectTrigger className="w-40">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="recurring">
									Recurring
								</SelectItem>
								<SelectItem value="expansion">
									Expansion
								</SelectItem>
								<SelectItem value="churn">Churn</SelectItem>
							</SelectContent>
						</Select>
					</CardHeader>
					<CardContent>
						<div className="h-56 flex items-end gap-3">
							{REVENUE_TREND.map((point) => (
								<div
									key={point.label}
									className="flex flex-1 flex-col items-center gap-2"
								>
									<div
										className="w-full rounded-md bg-gradient-to-t from-primary/40 via-primary/60 to-primary"
										style={{ height: `${point.value}%` }}
									/>
									<span className="text-xs text-muted-foreground">
										{point.label}
									</span>
								</div>
							))}
						</div>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div className="rounded-lg border px-4 py-3">
								<p className="text-sm text-muted-foreground">
									Expansion MRR
								</p>
								<p className="text-xl font-semibold">$12.6K</p>
							</div>
							<div className="rounded-lg border px-4 py-3">
								<p className="text-sm text-muted-foreground">
									Net revenue retention
								</p>
								<p className="text-xl font-semibold">118%</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Team activity</CardTitle>
						<CardDescription>
							Highlights from product + revenue teams.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{ACTIVITY.map((item) => (
							<div
								key={item.id}
								className="rounded-xl border p-4"
							>
								<p className="text-xs font-semibold text-muted-foreground">
									{item.id}
								</p>
								<p className="font-medium">{item.summary}</p>
								<div className="mt-2 flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										{item.team}
									</span>
									<span
										className={`font-medium ${
											item.status === "Blocked"
												? "text-red-500"
												: "text-emerald-500"
										}`}
									>
										{item.status}
									</span>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			<section className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle>Open deals</CardTitle>
							<CardDescription>
								Deals in commit for the next 30 days.
							</CardDescription>
						</div>
						<Button variant="outline" className="w-full sm:w-auto">
							View pipeline
						</Button>
					</CardHeader>

					<CardContent className="px-0">
						<div className="px-6">
							<div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b pb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
								<span>Company</span>
								<span>Owner</span>
								<span>Value</span>
								<span>Stage</span>
							</div>
						</div>

						<ul className="divide-y">
							{PIPELINE.map((deal) => (
								<li
									key={deal.company}
									className="px-6 py-4 grid items-center gap-4 grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"
								>
									<span className="font-medium">
										{deal.company}
									</span>
									<span className="text-muted-foreground">
										{deal.owner}
									</span>
									<span className="font-semibold">
										{deal.value}
									</span>
									<span className="text-sm text-muted-foreground">
										{deal.stage}
									</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Quick actions</CardTitle>
						<CardDescription>
							Shortcuts for your most frequent workflows.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button
							className="w-full justify-start"
							variant="outline"
						>
							Create customer brief
						</Button>
						<Button
							className="w-full justify-start"
							variant="outline"
						>
							Log executive update
						</Button>
						<Button
							className="w-full justify-start"
							variant="outline"
						>
							Schedule incident review
						</Button>
						<Button
							className="w-full justify-start"
							variant="outline"
						>
							Export finance pack
						</Button>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}

