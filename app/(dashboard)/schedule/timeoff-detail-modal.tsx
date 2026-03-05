"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { TimeOffViewContent } from "./timeoff-view-content";
import { TimeOffEditContent } from "./timeoff-edit-content";

interface TimeOffDetailModalProps {
	isVisible: boolean;
	onClose: () => void;
	activity: any; // Initial request info
	onUpdate?: () => void; // Refresh parent
}

export function TimeOffDetailModal({
	isVisible,
	onClose,
	activity,
	onUpdate,
}: TimeOffDetailModalProps) {
	const [mode, setMode] = useState<"view" | "edit">("view");
	const [request, setRequest] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

	const fetchRequestDetails = async () => {
		if (!activity?.id) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/timeoff/${activity.id}`);
			if (res.ok) {
				const json = await res.json();
				if (json.ok) {
					setRequest(json.data);
				}
			}
		} catch (error) {
			console.error("Failed to fetch request details:", error);
			toast.error("Failed to load time off request details");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isVisible && activity?.id) {
			fetchRequestDetails();
			setMode("view");
		} else {
			setRequest(null);
		}
	}, [isVisible, activity?.id]);

	const handleUpdate = async (formData: any) => {
		setSaving(true);
		try {
			const res = await fetch(`/api/timeoff/${request.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (res.ok) {
				const json = await res.json();
				if (json.ok) {
					toast.success("Time off request updated");
					setRequest(json.data);
					setMode("view");
					onUpdate?.();
				}
			} else {
				throw new Error("Failed to update request");
			}
		} catch (error) {
			console.error("Update error:", error);
			toast.error("Failed to update time off request");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setSaving(true);
		try {
			const res = await fetch(`/api/timeoff/${request.id}`, {
				method: "DELETE",
			});

			if (res.ok) {
				toast.success("Time off request deleted");
				onClose();
				onUpdate?.();
			} else {
				throw new Error("Failed to delete request");
			}
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("Failed to delete time off request");
		} finally {
			setSaving(false);
			setIsConfirmDeleteOpen(false);
		}
	};

	return (
		<Dialog open={isVisible} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[600px] p-0 overflow-hidden flex flex-col max-h-[90vh]">
				<VisuallyHidden.Root>
					<DialogTitle>
						{request
							? `Time Off: ${request.type?.name}`
							: "Time Off Details"}
					</DialogTitle>
				</VisuallyHidden.Root>
				{loading ? (
					<div className="flex flex-col items-center justify-center p-20 space-y-4">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-sm text-muted-foreground">
							Loading details...
						</p>
					</div>
				) : request ? (
					mode === "view" ? (
						<TimeOffViewContent
							request={request}
							onEdit={() => setMode("edit")}
							onDelete={() => setIsConfirmDeleteOpen(true)}
							onClose={onClose}
						/>
					) : (
						<TimeOffEditContent
							request={request}
							onSave={handleUpdate}
							onCancel={() => setMode("view")}
							isSaving={saving}
						/>
					)
				) : (
					<div className="p-10 text-center text-muted-foreground">
						No data available
					</div>
				)}
			</DialogContent>

			<ConfirmationDialog
				open={isConfirmDeleteOpen}
				onOpenChange={setIsConfirmDeleteOpen}
				title="Delete Time Off Request"
				description="Are you sure you want to delete this time off request? This action cannot be undone."
				confirmText="Delete"
				variant="destructive"
				onConfirm={handleDelete}
				loading={saving}
			/>
		</Dialog>
	);
}
