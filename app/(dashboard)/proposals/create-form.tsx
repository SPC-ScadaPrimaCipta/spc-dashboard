"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner

export default function CreateProposalForm() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [uploading, setUploading] = useState(false);

	const [formData, setFormData] = useState({
		title: "",
		budget: "",
		description: "",
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setFiles(Array.from(e.target.files));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// 1. Upload files first
			let attachments: any[] = [];
			if (files.length > 0) {
				setUploading(true);
				const uploadFormData = new FormData();
				files.forEach((file) => {
					uploadFormData.append("files", file);
				});

				const uploadRes = await fetch("/api/uploads", {
					method: "POST",
					body: uploadFormData,
				});

				if (!uploadRes.ok) throw new Error("File upload failed");
				attachments = await uploadRes.json();
				setUploading(false);
			}

			// 2. Create Proposal
			const res = await fetch("/api/proposals", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					budget: formData.budget
						? parseFloat(formData.budget)
						: null,
					attachments, // Pass uploaded file metadata
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Failed to create proposal");
			}

			toast.success("Proposal created successfully");
			router.push("/proposals");
			router.refresh();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message);
		} finally {
			setLoading(false);
			setUploading(false);
		}
	};

	return (
		<Card className="max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>Create Project Proposal</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="title">Project Title</Label>
						<Input
							id="title"
							required
							value={formData.title}
							onChange={(e) =>
								setFormData({
									...formData,
									title: e.target.value,
								})
							}
							placeholder="e.g., Q3 Marketing Campaign"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="budget">Budget ($)</Label>
						<Input
							id="budget"
							type="number"
							step="0.01"
							value={formData.budget}
							onChange={(e) =>
								setFormData({
									...formData,
									budget: e.target.value,
								})
							}
							placeholder="0.00"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData({
									...formData,
									description: e.target.value,
								})
							}
							placeholder="Describe the project goals and scope..."
							rows={4}
						/>
					</div>

					<div className="space-y-2">
						<Label>Attachments</Label>
						<div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
							<Upload className="h-8 w-8 text-muted-foreground mb-2" />
							<p className="text-sm text-muted-foreground mb-2">
								Drag and drop files here, or click to select
							</p>
							<Input
								type="file"
								multiple
								className="hidden"
								id="file-upload"
								onChange={handleFileChange}
							/>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								onClick={() =>
									document
										.getElementById("file-upload")
										?.click()
								}
							>
								Select Files
							</Button>
						</div>

						{files.length > 0 && (
							<ul className="space-y-2 mt-4">
								{files.map((file, i) => (
									<li
										key={i}
										className="flex items-center justify-between p-2 border rounded-md text-sm"
									>
										<span className="truncate max-w-[200px]">
											{file.name}
										</span>
										<span className="text-muted-foreground text-xs">
											{(file.size / 1024).toFixed(0)}KB
										</span>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{uploading ? "Uploading..." : "Saving..."}
								</>
							) : (
								"Create Proposal"
							)}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
