"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Minimal Zod Schema
const quickCreateSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
});

type QuickCreateFormValues = z.infer<typeof quickCreateSchema>;

interface TaskQuickCreateModalProps {
	isOpen: boolean;
	onClose: () => void;
	onTaskCreated: () => void;
	resourceId?: string;
	resourceName?: string;
	startAt?: string; // ISO string from DayPilot
	endAt?: string; // ISO string from DayPilot
	view?: string; // To conditionally display time and end date
}

export function TaskQuickCreateModal({
	isOpen,
	onClose,
	onTaskCreated,
	resourceId,
	resourceName,
	startAt,
	endAt,
	view,
}: TaskQuickCreateModalProps) {
	const [statusId, setStatusId] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<QuickCreateFormValues>({
		resolver: zodResolver(quickCreateSchema),
		defaultValues: {
			title: "",
			description: "",
		},
	});

	// Fetch default status once
	useEffect(() => {
		if (isOpen) {
			reset();
			const fetchDefaultStatus = async () => {
				try {
					const res = await fetch("/api/task-statuses");
					if (res.ok) {
						const data = await res.json();
						if (data.ok && data.data?.length > 0) {
							setStatusId(data.data[0].id);
						}
					}
				} catch (error) {
					console.error("Failed to fetch default status", error);
				}
			};

			if (!statusId) fetchDefaultStatus();
		}
	}, [isOpen, reset, statusId]);

	const onSubmit: SubmitHandler<QuickCreateFormValues> = async (data) => {
		if (!statusId) {
			toast.error("Default status is not configured.");
			return;
		}

		setIsSubmitting(true);
		try {
			let finalEndAt = endAt;
			if (endAt && view && view !== "Day") {
				const endObj = new Date(endAt.replace("Z", ""));
				endObj.setDate(endObj.getDate() - 1);
				finalEndAt = format(endObj, "yyyy-MM-dd'T'HH:mm:ss") + ".000Z";
			}

			const payload = {
				...data,
				statusId,
				resourceId,
				startAt,
				endAt: finalEndAt,
				type: "TASK",
				priority: "MEDIUM",
				allDay: true,
			};

			const response = await fetch("/api/tasks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const result = await response.json();

			if (!response.ok || !result.ok) {
				throw new Error(result.error || "Failed to create task");
			}

			toast.success("Task quickly created");
			reset();
			onTaskCreated();
			onClose();
		} catch (error: any) {
			console.error("Create task error:", error);
			toast.error(error.message || "Failed to create task");
		} finally {
			setIsSubmitting(false);
		}
	};

	let formattedStart = "";
	let formattedEnd = "";
	const isAllDayLike = view && view !== "Day";

	if (startAt) {
		const startObj = new Date(startAt.replace("Z", ""));
		formattedStart = format(
			startObj,
			isAllDayLike ? "MMM d, yyyy" : "MMM d, yyyy h:mm a",
		);
	}
	if (endAt) {
		const endObj = new Date(endAt.replace("Z", ""));
		if (isAllDayLike) {
			endObj.setDate(endObj.getDate() - 1);
			formattedEnd = format(endObj, "MMM d, yyyy");
		} else {
			formattedEnd = format(endObj, "MMM d, yyyy h:mm a");
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Quick Create Task</DialogTitle>
				</DialogHeader>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-4 mt-2"
				>
					<div className="bg-muted p-3 rounded-lg text-sm space-y-1">
						{resourceName && (
							<div className="flex justify-between">
								<span className="text-muted-foreground font-medium">
									Resource:
								</span>
								<span className="font-semibold">
									{resourceName}
								</span>
							</div>
						)}
						{formattedStart && formattedEnd && (
							<div className="flex justify-between">
								<span className="text-muted-foreground font-medium">
									Time:
								</span>
								<span className="text-right">
									{formattedStart} <br /> to {formattedEnd}
								</span>
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="title">Title *</Label>
						<Input
							id="title"
							autoFocus
							{...register("title")}
							placeholder="Task title"
						/>
						{errors.title && (
							<p className="text-xs text-red-500">
								{errors.title.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							{...register("description")}
							placeholder="Brief description (optional)..."
							className="h-20 max-h-40"
						/>
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
