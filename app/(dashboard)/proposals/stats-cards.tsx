"use client";

import { StatsCard } from "@/components/stats-card";
import { FileText, CheckCircle, Clock } from "lucide-react";

export function StatsCards({ proposals }: { proposals: any[] }) {
	const total = proposals.length;
	const approved = proposals.filter((p) => p.status === "APPROVED").length;
	const pending = proposals.filter(
		(p) => p.status === "PENDING_APPROVAL",
	).length;
	// Calculate total budget for approved/all if needed, kept simple for now

	return (
		<div className="grid gap-4 md:grid-cols-3 mb-6">
			<StatsCard
				title="Total Proposals"
				value={total}
				icon={FileText}
				className="bg-primary/5 border-primary/20"
				iconClassName="text-primary/10"
			/>
			<StatsCard
				title="Approved"
				value={approved}
				icon={CheckCircle}
				className="bg-green-500/5 border-green-500/20"
				iconClassName="text-green-500/10"
			/>
			<StatsCard
				title="Pending"
				value={pending}
				icon={Clock}
				className="bg-orange-500/5 border-orange-500/20"
				iconClassName="text-orange-500/10"
			/>
		</div>
	);
}
