"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useRouter } from "next/navigation";

import { TaskViewContent } from "./task-view-content";
import { TaskEditContent } from "./task-edit-content";

interface TaskDetailModalProps {
	isVisible: boolean;
	onClose: () => void;
	activity: any; // Summary task from Gantt/Calendar
	onEdit: () => void;
	onUpdate?: () => void; // Refresh parent
	onCopy?: (task: any) => void;
}

const COLORS = [
	{ name: "Blue", value: "#3b82f6" },
	{ name: "Red", value: "#ef4444" },
	{ name: "Green", value: "#22c55e" },
	{ name: "Yellow", value: "#eab308" },
	{ name: "Purple", value: "#a855f7" },
	{ name: "Pink", value: "#ec4899" },
	{ name: "Orange", value: "#f97316" },
	{ name: "Gray", value: "#6b7280" },
];

export function ActivityDetailsModal({
	isVisible,
	onClose,
	activity,
	onEdit,
	onUpdate,
	onCopy,
}: TaskDetailModalProps) {
	const [fullTask, setFullTask] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [commenting, setCommenting] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const router = useRouter();

	const [isEditing, setIsEditing] = useState(false);
	const [statuses, setStatuses] = useState<any[]>([]);
	const [formData, setFormData] = useState<any>({});
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		fetch("/api/task-statuses")
			.then((res) => res.json())
			.then((data) => {
				if (data.ok) setStatuses(data.data);
			});
	}, []);

	useEffect(() => {
		if (activity || fullTask) {
			const t = fullTask || activity;
			setFormData({
				title: t.title,
				description: t.description || "",
				statusId: t.statusId,
				priority: t.priority,
				startAt: t.startAt || t.startDate,
				endAt: t.endAt || t.endDate,
				color: t.color || "#3b82f6",
				assigneeIds:
					t.assignments?.map((a: any) => a.assignee?.id) || [],
				assignees:
					t.assignments?.map((a: any) => a.assignee) || [],
				labelSlugs: t.labels?.map((l: any) => l.label?.slug) || [],
				isFullDay: t.allDay,
				locationId: t.locationId,
				code: t.code || "",
			});
		}
	}, [activity, fullTask]);

	const handleSave = async () => {
		setIsSaving(true);

		const patchData = {
			...formData,
			allDay: formData.isFullDay,
		};
		// Prevent passing `isFullDay` since backend probably expects `allDay`
		// if they strictly parse schema using zod `TaskUpdateSchema`.
		delete patchData.isFullDay;

		try {
			const res = await fetch(`/api/tasks/${(fullTask || activity).id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(patchData),
			});
			if (res.ok) {
				toast.success("Task updated");
				setIsEditing(false);
				onUpdate?.();
				fetchTaskDetails((fullTask || activity).id); // Refresh local data
				router.refresh();
			} else {
				toast.error("Failed to update task");
			}
		} catch (error) {
			toast.error("Error updating task");
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		if (isVisible && activity?.id) {
			fetchTaskDetails(activity.id);
		} else {
			setFullTask(null);
		}
	}, [isVisible, activity]);

	const fetchTaskDetails = async (id: string) => {
		setLoading(true);
		try {
			const res = await fetch(`/api/tasks/${id}`);
			if (!res.ok) throw new Error("Failed to fetch task details");
			const json = await res.json();
			if (json.ok) {
				setFullTask(json.data);
			}
		} catch (error) {
			console.error("Error fetching task details:", error);
			toast.error("Could not load task details");
		} finally {
			setLoading(false);
		}
	};

	const handleAddComment = async () => {
		if (!commentText.trim() || !fullTask) return;
		setCommenting(true);
		try {
			console.log("Add comment:", commentText);
			toast.info("Comment feature coming soon");
			setCommentText("");
		} catch (error) {
			toast.error("Failed to add comment");
		} finally {
			setCommenting(false);
		}
	};

	const handleDelete = () => {
		setDeleteOpen(true);
	};

	const confirmDelete = async () => {
		setIsDeleting(true);
		try {
			const res = await fetch(`/api/tasks/${activity.id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				toast.success("Task deleted");
				setDeleteOpen(false);
				onClose();
				onUpdate?.();
				router.refresh();
			} else {
				toast.error("Failed to delete task");
			}
		} catch (e) {
			toast.error("Error deleting task");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!activity && !fullTask) return null;

	const task = fullTask || activity;

	return (
		<Dialog open={isVisible} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className={cn(
					"h-[85vh] p-0 gap-0 overflow-hidden flex flex-col bg-background transition-all duration-200 ease-in-out",
					isEditing ? "sm:max-w-[1600px]" : "max-w-7xl",
				)}
			>
				{loading && (
					<div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center z-50 backdrop-blur-[2px]">
						<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
						<p className="text-sm text-muted-foreground font-medium">
							Loading details...
						</p>
					</div>
				)}

				{isEditing ? (
					<TaskEditContent
						task={task}
						fullTask={fullTask}
						formData={formData}
						setFormData={setFormData}
						statuses={statuses}
						isSaving={isSaving}
						onSave={handleSave}
						onCancel={() => setIsEditing(false)}
					/>
				) : (
					<TaskViewContent
						task={task}
						fullTask={fullTask}
						onEdit={() => setIsEditing(true)}
						onDelete={handleDelete}
						onCopy={onCopy}
						onClose={onClose}
						commentText={commentText}
						setCommentText={setCommentText}
						commenting={commenting}
						onAddComment={handleAddComment}
					/>
				)}

				{/* Footer */}
				<div className="p-4 border-t border-border bg-background shrink-0">
					<Button variant="outline" className="w-full" asChild>
						<Link href={`/schedule/task/${task.id}`}>
							View Full Page{" "}
							<ExternalLink className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</DialogContent>
			<ConfirmationDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title="Delete Task"
				description="Are you sure you want to delete this task? This action cannot be undone."
				confirmText="Delete"
				variant="destructive"
				loading={isDeleting}
				onConfirm={confirmDelete}
			/>
		</Dialog>
	);
}
