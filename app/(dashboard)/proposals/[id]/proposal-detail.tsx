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

	if (loading)
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="animate-spin" />
			</div>
		);

	if (!proposal) return <div>Proposal not found</div>;

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<div className="flex items-center gap-4">
				<Button variant="ghost" asChild>
					<Link href="/proposals">
						<ArrowLeft className="mr-2 h-4 w-4" /> Back
					</Link>
				</Button>
				<h1 className="text-2xl font-bold tracking-tight flex-1">
					{proposal.title}
				</h1>
				<Badge
					className="text-sm px-3 py-1"
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
							<p className="whitespace-pre-wrap text-muted-foreground">
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
											className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
										>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
													<FileIcon className="h-5 w-5" />
												</div>
												<div>
													<p className="font-medium text-sm">
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
										? `$${Number(proposal.budget).toFixed(
												2
										  )}`
										: "N/A"}
								</p>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Author
								</p>
								<p>
									{proposal.user
										? proposal.user.name ||
										  proposal.user.email
										: proposal.userId}
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
					{proposal.status === "DRAFT" && (
						<Card>
							<CardHeader>
								<CardTitle>Actions</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-2">
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
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
