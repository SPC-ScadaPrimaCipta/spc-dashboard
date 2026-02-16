"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatsCards } from "./stats-cards";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/datatable/data-table";
import { columns, Proposal } from "./columns";

export default function ProposalsPage() {
	const [proposals, setProposals] = useState<Proposal[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	const fetchProposals = async () => {
		try {
			const res = await fetch("/api/proposals");
			if (res.ok) {
				const data = await res.json();
				setProposals(data);
			}
		} catch (error) {
			console.error("Failed to fetch proposals", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProposals();
	}, []);

	const handleSubmit = async (id: string) => {
		try {
			const res = await fetch(`/api/proposals/${id}/submit`, {
				method: "POST",
			});

			if (!res.ok) {
				const { error: errorData } = await res.json();
				console.log("errorData", errorData);
				throw new Error(errorData || "Failed to submit");
			}

			toast.success("Proposal submitted for approval");
			fetchProposals();
		} catch (error: any) {
			toast.error(error.message || "Failed to submit proposal");
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure?")) return;
		try {
			const res = await fetch(`/api/proposals/${id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete");
			toast.success("Proposal deleted");
			fetchProposals();
		} catch (e) {
			toast.error("Failed to delete");
		}
	};

	if (loading)
		return (
			<div className="p-8 flex justify-center">
				<Loader2 className="animate-spin" />
			</div>
		);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold tracking-tight">
					Project Proposals
				</h1>
				<Button asChild>
					<Link href="/proposals/new">
						<Plus className="mr-2 h-4 w-4" /> New Proposal
					</Link>
				</Button>
			</div>

			<StatsCards proposals={proposals} />

			<DataTable
				columns={columns(handleSubmit, handleDelete)}
				data={proposals}
				filterKey="title"
			/>
		</div>
	);
}
