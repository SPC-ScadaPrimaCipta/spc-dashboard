"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { UserSearchMultiSelect } from "@/components/user-search-multiselect";
import { LabelMultiSelect } from "@/components/label-multi-select";
import { DateTimePicker } from "@/components/date-time-picker";

// Zod Schema
const createTaskSchema = z.object({
	title: z.string().min(1, "Title is required"),
	statusId: z.string().min(1, "Status is required"),
	assigneeIds: z
		.array(z.string())
		.min(1, "At least one assignee is required"),
	description: z.string().optional(),
	type: z.enum(["TASK", "MILESTONE", "SUMMARY"]).default("TASK"),
	priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
	startAt: z
		.union([z.string(), z.date(), z.null(), z.undefined()])
		.optional(),
	endAt: z.union([z.string(), z.date(), z.null(), z.undefined()]).optional(),
	durationMin: z.coerce.number().optional(),
	allDay: z.boolean().default(false),
	labelSlugs: z.array(z.string()).optional(),
	color: z.string().optional(),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

interface CreateTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	onTaskCreated: () => void;
}

export function CreateTaskModal({
	isOpen,
	onClose,
	onTaskCreated,
}: CreateTaskModalProps) {
	const [statuses, setStatuses] = useState<any[]>([]);
	const [users, setUsers] = useState<any[]>([]);
	const [labels, setLabels] = useState<any[]>([]);
	const [pendingLabels, setPendingLabels] = useState<any[]>([]);
	const [loadingOptions, setLoadingOptions] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		control,
		setValue,
		getValues,
		reset,
		watch,
		formState: { errors },
	} = useForm<CreateTaskFormValues>({
		resolver: zodResolver(createTaskSchema) as any,
		defaultValues: {
			title: "",
			statusId: "",
			assigneeIds: [],
			description: "",
			type: "TASK",
			priority: "MEDIUM",
			startAt: undefined,
			endAt: undefined,
			allDay: false,
			labelSlugs: [],
			color: "#3b82f6",
		},
	});

	// Fetch Options
	useEffect(() => {
		if (isOpen) {
			const fetchOptions = async () => {
				setLoadingOptions(true);
				try {
					const [statusRes, userRes, labelRes] = await Promise.all([
						fetch("/api/task-statuses"),
						fetch("/api/users"),
						fetch("/api/labels"),
					]);

					if (statusRes.ok) {
						const data = await statusRes.json();
						if (data.ok) setStatuses(data.data || []);
					}
					if (userRes.ok) {
						const data = await userRes.json();
						if (data.ok) setUsers(data.data || []);
					}
					if (labelRes.ok) {
						const data = await labelRes.json();
						if (data.ok) setLabels(data.data || []);
					}
				} catch (error) {
					console.error("Failed to fetch options", error);
					toast.error("Failed to load task options");
				} finally {
					setLoadingOptions(false);
				}
			};

			fetchOptions();
		}
	}, [isOpen]);

	// Set default status if available and not set
	useEffect(() => {
		if (statuses.length > 0 && !getValues("statusId")) {
			const defaultStatus = statuses[0];
			if (defaultStatus) {
				setValue("statusId", defaultStatus.id);
			}
		}
	}, [statuses, setValue, getValues]);

	const onSubmit: SubmitHandler<CreateTaskFormValues> = async (data) => {
		setIsSubmitting(true);
		try {
			// Format dates to ISO if present and non-empty
			const startAt = data.startAt
				? new Date(data.startAt).toISOString()
				: undefined;
			const endAt = data.endAt
				? new Date(data.endAt).toISOString()
				: undefined;

			const payload = {
				...data,
				startAt,
				endAt,
				durationMin: data.durationMin || undefined,
				newPendingLabels: pendingLabels, // Send these to backend
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

			toast.success("Task created successfully");
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

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create New Task</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						{/* Title */}
						<div className="col-span-2 space-y-2">
							<Label htmlFor="title">Title *</Label>
							<Input
								id="title"
								{...register("title")}
								placeholder="Task title"
							/>
							{errors.title && (
								<p className="text-xs text-red-500">
									{errors.title.message}
								</p>
							)}
						</div>

						{/* Status */}
						<div className="space-y-2">
							<Label>Status *</Label>
							<Controller
								control={control}
								name="statusId"
								render={({ field }) => (
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={loadingOptions}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											{statuses.map((status) => (
												<SelectItem
													key={status.id}
													value={status.id}
												>
													{status.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.statusId && (
								<p className="text-xs text-red-500">
									{errors.statusId.message}
								</p>
							)}
						</div>

						{/* Type */}
						<div className="space-y-2">
							<Label>Type</Label>
							<Controller
								control={control}
								name="type"
								render={({ field }) => (
									<Select
										onValueChange={field.onChange}
										value={field.value}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="TASK">
												Task
											</SelectItem>
											<SelectItem value="MILESTONE">
												Milestone
											</SelectItem>
											<SelectItem value="SUMMARY">
												Summary
											</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>

						{/* Priority */}
						<div className="space-y-2">
							<Label>Priority</Label>
							<Controller
								control={control}
								name="priority"
								render={({ field }) => (
									<Select
										onValueChange={field.onChange}
										value={field.value}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select priority" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="LOW">
												Low
											</SelectItem>
											<SelectItem value="MEDIUM">
												Medium
											</SelectItem>
											<SelectItem value="HIGH">
												High
											</SelectItem>
											<SelectItem value="CRITICAL">
												Critical
											</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>

						{/* All Day Switch */}
						<div className="flex items-center space-x-2 pt-8">
							<Controller
								control={control}
								name="allDay"
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
							<Label>All Day</Label>
						</div>

						{/* Start At */}
						<div className="space-y-2">
							<Label>Start Date</Label>
							<Controller
								control={control}
								name="startAt"
								render={({ field }) => (
									<DateTimePicker
										date={
											field.value
												? new Date(field.value)
												: undefined
										}
										setDate={field.onChange}
										includeTime={!watch("allDay")}
									/>
								)}
							/>
						</div>

						{/* End At */}
						<div className="space-y-2">
							<Label>End Date</Label>
							<Controller
								control={control}
								name="endAt"
								render={({ field }) => (
									<DateTimePicker
										date={
											field.value
												? new Date(field.value)
												: undefined
										}
										setDate={field.onChange}
										includeTime={!watch("allDay")}
									/>
								)}
							/>
						</div>

						{/* Duration (Alternative to End Date) */}
						<div className="space-y-2">
							<Label>Duration (minutes)</Label>
							<Input
								type="number"
								placeholder="e.g. 60"
								{...register("durationMin")}
							/>
						</div>

						{/* Assignees (Multi-select) */}
						<div className="col-span-2 space-y-2">
							<Label>Assignees *</Label>
							<Controller
								control={control}
								name="assigneeIds"
								render={({ field }) => (
									<UserSearchMultiSelect
										selectedIds={field.value}
										onChange={field.onChange}
										placeholder="Select assignees..."
									/>
								)}
							/>
							{errors.assigneeIds && (
								<p className="text-xs text-red-500">
									{errors.assigneeIds.message}
								</p>
							)}
						</div>

						{/* Labels (Multi-select) */}
						<div className="col-span-2 space-y-2">
							<Label>Labels</Label>
							<Controller
								control={control}
								name="labelSlugs"
								render={({ field }) => (
									<LabelMultiSelect
										selectedSlugs={field.value || []}
										onChange={field.onChange}
										placeholder="Select labels..."
										existingLabels={[
											...labels,
											...pendingLabels,
										]}
										onLabelCreate={(newLabel) => {
											setPendingLabels((prev) => [
												...prev,
												newLabel,
											]);
										}}
									/>
								)}
							/>
						</div>

						{/* Description */}
						<div className="col-span-2 space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								{...register("description")}
								placeholder="Task description..."
								className="h-24"
							/>
						</div>
					</div>

					<DialogFooter>
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
							Create Task
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
