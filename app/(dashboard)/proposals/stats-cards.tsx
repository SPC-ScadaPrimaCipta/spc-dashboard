"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock } from "lucide-react";

export function StatsCards({ proposals }: { proposals: any[] }) {
	const total = proposals.length;
	const approved = proposals.filter((p) => p.status === "APPROVED").length;
	const pending = proposals.filter(
		(p) => p.status === "PENDING_APPROVAL"
	).length;
	// Calculate total budget for approved/all if needed, kept simple for now

	return (
		<div className="grid gap-4 md:grid-cols-3 mb-6">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Total Proposals
					</CardTitle>
					<FileText className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{total}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Approved
					</CardTitle>
					<CheckCircle className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{approved}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Pending
					</CardTitle>
					<Clock className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{pending}</div>
				</CardContent>
			</Card>
		</div>
	);
}
