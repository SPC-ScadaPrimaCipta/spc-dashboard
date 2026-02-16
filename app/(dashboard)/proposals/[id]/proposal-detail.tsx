"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileIcon, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { WorkflowActions } from "@/components/workflow/workflow-actions";
import { formatIDR } from "@/lib/utils";

export default function ProposalDetail({ id }: { id: string }) {
	const [proposal, setProposal] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	const fetchProposal = async () => {
		try {
			const res = await fetch(`/api/proposals/${id}`);
			if (!res.ok) throw new Error("Failed to fetch proposal");
			const data = await res.json();
			setProposal(data);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load proposal details");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProposal();
	}, [id]);

	const handleSubmit = async () => {
		try {
			const res = await fetch(`/api/proposals/${id}/submit`, {
				method: "POST",
			});
			if (!res.ok) throw new Error("Failed to submit");
			toast.success("Proposal submitted for approval");
			fetchProposal(); // Refresh to update status
		} catch (e) {
			toast.error("Failed to submit proposal");
		}
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this proposal?")) return;
		try {
			const res = await fetch(`/api/proposals/${id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete");
			toast.success("Proposal deleted");
			router.push("/proposals");
		} catch (e) {
			toast.error("Failed to delete");
		}
	};

	const handleActionSuccess = async (data: any) => {
		if (data?.status === "COMPLETED") {
			try {
				await fetch(`/api/proposals/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: "APPROVED" }),
				});
				toast.success("Proposal approved successfully");
			} catch (error) {
				console.error("Failed to update status", error);
			}
		}
		fetchProposal();
	};

	if (loading)
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="animate-spin" />
			</div>
		);

	if (!proposal) return <div>Proposal not found</div>;

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center gap-4">
				<Button variant="ghost" asChild className="w-fit">
					<Link href="/proposals">
						<ArrowLeft className="mr-2 h-4 w-4" /> Back
					</Link>
				</Button>
				<h1 className="text-2xl font-bold tracking-tight flex-1 wrap-break-word">
					{proposal.title}
				</h1>
				<Badge
					className="text-sm px-3 py-1 w-fit"
					variant={
						proposal.status === "APPROVED"
							? "default"
							: proposal.status === "REJECTED"
							? "destructive"
							: proposal.status === "PENDING_APPROVAL"
							? "secondary"
							: "outline"
					}
				>
					{proposal.status}
				</Badge>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Main Content */}
				<div className="md:col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Description</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="whitespace-pre-wrap text-muted-foreground wrap-break-word">
								{proposal.description ||
									"No description provided."}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Attachments</CardTitle>
						</CardHeader>
						<CardContent>
							{proposal.attachments &&
							proposal.attachments.length > 0 ? (
								<div className="space-y-2">
									{proposal.attachments.map((file: any) => (
										<div
											key={file.id}
											className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors gap-3"
										>
											<div className="flex items-center gap-3 overflow-hidden">
												<div className="shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
													<FileIcon className="h-5 w-5" />
												</div>
												<div className="min-w-0">
													<p className="font-medium text-sm truncate">
														{file.name}
													</p>
													<p className="text-xs text-muted-foreground">
														{(
															file.size / 1024
														).toFixed(0)}{" "}
														KB •{" "}
														{new Date(
															file.createdAt
														).toLocaleDateString()}
													</p>
												</div>
											</div>
											<Button
												variant="outline"
												size="sm"
												asChild
												className="w-full sm:w-auto"
											>
												<a
													href={file.url}
													download
													target="_blank"
													rel="noopener noreferrer"
												>
													Download
												</a>
											</Button>
										</div>
									))}
								</div>
							) : (
								<p className="text-muted-foreground text-sm">
									No attachments found.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Sidebar Info */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Budget
								</p>
								<p className="text-xl font-bold">
									{proposal.budget
										? formatIDR(proposal.budget)
										: "N/A"}
								</p>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Author
								</p>
								<p className="wrap-break-word">
									{proposal.user
										? proposal.user.name ||
										  proposal.user.email
										: proposal.userId || "Unknown"}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Created
								</p>
								<p>
									{new Date(
										proposal.createdAt
									).toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Last Updated
								</p>
								<p>
									{new Date(
										proposal.updatedAt
									).toLocaleString()}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Actions */}
					{proposal.currentStepInstanceId && (
						<Card>
							<CardHeader>
								<CardTitle>Actions</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-2">
								{proposal.currentStepInstanceId ? (
									<WorkflowActions
										stepInstanceId={
											proposal.currentStepInstanceId
										}
										onSuccess={handleActionSuccess}
									/>
								) : (
									<>
										<Button
											className="w-full"
											onClick={handleSubmit}
										>
											Submit for Approval
										</Button>
										<Button
											variant="destructive"
											className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 bg-transparent border border-red-200"
											onClick={handleDelete}
										>
											Delete Proposal
										</Button>
									</>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
