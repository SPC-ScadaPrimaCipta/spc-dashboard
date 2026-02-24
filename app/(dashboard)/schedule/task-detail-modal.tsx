"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
	Clock,
	MoreHorizontal,
	User as UserIcon,
	Tag,
	MessageSquare,
	Activity,
	Plus,
	ExternalLink,
	Edit,
	Trash2,
	Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { UserSearchMultiSelect } from "@/components/user-search-multiselect";
import { LabelMultiSelect } from "@/components/label-multi-select";
import { DateTimePicker } from "@/components/date-time-picker";
import { Loader2 } from "lucide-react";

interface TaskDetailModalProps {
	isVisible: boolean;
	onClose: () => void;
	activity: any; // Summary task from Gantt/Calendar
	onEdit: () => void;
	onUpdate?: () => void; // Refresh parent
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
				labelSlugs: t.labels?.map((l: any) => l.label?.slug) || [],
				isFullDay: t.allDay,
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

	const handleAttributeUpdate = async (updates: any) => {
		try {
			const res = await fetch(`/api/tasks/${(fullTask || activity).id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			});
			if (res.ok) {
				toast.success("Updated successfully");
				onUpdate?.();
				fetchTaskDetails((fullTask || activity).id);
				router.refresh();
			} else {
				toast.error("Failed to update");
			}
		} catch (error) {
			toast.error("Error updating");
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
				{/* Header */}
				<div
					className="px-6 py-4 border-b border-border shrink-0 relative transition-colors duration-200"
					style={
						formData.color && isEditing
							? {
									backgroundColor: `${formData.color}10`,
									borderLeft: `4px solid ${formData.color}`,
								}
							: task.color
								? {
										backgroundColor: `${task.color}10`,
										borderLeft: `4px solid ${task.color}`,
									}
								: {
										backgroundColor: "var(--muted)",
										opacity: 0.2,
									}
					}
				>
					<div className="flex items-start justify-between gap-4 pr-6">
						<div className="space-y-3 flex-1">
							{isEditing ? (
								<div className="space-y-3">
									<Input
										value={formData.title}
										onChange={(e) =>
											setFormData({
												...formData,
												title: e.target.value,
											})
										}
										className="text-lg font-semibold h-10"
										placeholder="Task Title"
									/>
									<div className="flex items-center gap-2">
										<Select
											value={formData.statusId}
											onValueChange={(val) =>
												setFormData({
													...formData,
													statusId: val,
												})
											}
										>
											<SelectTrigger className="h-8 w-[140px]">
												<SelectValue placeholder="Status" />
											</SelectTrigger>
											<SelectContent>
												{statuses.map((s) => (
													<SelectItem
														key={s.id}
														value={s.id}
													>
														{s.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<Select
											value={formData.priority}
											onValueChange={(val) =>
												setFormData({
													...formData,
													priority: val,
												})
											}
										>
											<SelectTrigger className="h-8 w-[110px]">
												<SelectValue placeholder="Priority" />
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

										<div className="flex items-center gap-1 ml-2">
											{COLORS.map((c) => (
												<button
													key={c.value}
													type="button"
													onClick={() =>
														setFormData({
															...formData,
															color: c.value,
														})
													}
													className={cn(
														"w-5 h-5 rounded-full border border-muted ring-offset-background transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
														formData.color ===
															c.value &&
															"ring-2 ring-ring ring-offset-2 scale-110",
													)}
													style={{
														backgroundColor:
															c.value,
													}}
													title={c.name}
												/>
											))}
										</div>
									</div>
								</div>
							) : (
								<>
									<div className="flex items-center gap-2 mb-2">
										<Badge
											variant="outline"
											className={cn(
												"capitalize",
												task.status?.name === "Done"
													? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
													: task.status?.name ===
														  "In Progress"
														? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
														: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
											)}
										>
											{task.status?.name || "No Status"}
										</Badge>
										<Badge
											variant="secondary"
											className="text-xs font-normal"
										>
											{task.priority || "MEDIUM"}
										</Badge>
									</div>
									<DialogTitle className="text-xl leading-tight">
										{task.title}
									</DialogTitle>
								</>
							)}
						</div>

						<div className="flex items-center gap-2">
							{isEditing ? (
								<>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsEditing(false)}
										className="h-8"
									>
										Cancel
									</Button>
									<Button
										size="sm"
										onClick={handleSave}
										disabled={isSaving}
										className="h-8"
									>
										{isSaving && (
											<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
										)}
										Save
									</Button>
								</>
							) : (
								<>
									<Button
										variant="outline"
										size="sm"
										className="h-8"
										onClick={() => setIsEditing(true)}
									>
										<Edit className="h-3.5 w-3.5" />{" "}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
										onClick={handleDelete}
									>
										<Trash2 className="h-3.5 w-3.5" />{" "}
									</Button>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Scrollable Body */}
				<div className="flex-1 overflow-y-auto min-h-0 relative">
					{loading && (
						<div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center z-50 backdrop-blur-[2px]">
							<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
							<p className="text-sm text-muted-foreground font-medium">
								Loading details...
							</p>
						</div>
					)}
					<div className="p-6 space-y-8">
						{/* Schedule Section */}
						<section className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Clock className="h-4 w-4" /> Schedule
								</h4>
								{isEditing && (
									<div className="flex items-center gap-2">
										<Checkbox
											id="full-day"
											checked={
												formData.isFullDay || false
											}
											onCheckedChange={(checked) => {
												const isChecked =
													checked === true;
												const updates: any = {
													isFullDay: isChecked,
												};
												if (isChecked) {
													if (formData.startAt) {
														const s = new Date(
															String(
																formData.startAt,
															).replace("Z", ""),
														);
														s.setHours(0, 0, 0, 0);
														updates.startAt =
															format(
																s,
																"yyyy-MM-dd'T'HH:mm:ss.000'Z'",
															);
													}
													if (formData.endAt) {
														const e = new Date(
															String(
																formData.endAt,
															).replace("Z", ""),
														);
														e.setHours(0, 0, 0, 0);
														updates.endAt = format(
															e,
															"yyyy-MM-dd'T'HH:mm:ss.000'Z'",
														);
													}
												}
												setFormData({
													...formData,
													...updates,
												});
											}}
										/>
										<Label htmlFor="full-day">
											Full Day
										</Label>
									</div>
								)}
							</div>
							<div
								className={cn(
									"grid gap-4 bg-muted/30 p-4 rounded-lg border border-border",
									isEditing ? "grid-cols-1" : "grid-cols-2",
								)}
							>
								<div>
									<div className="text-xs text-muted-foreground mb-1">
										Start
									</div>
									{isEditing ? (
										<DateTimePicker
											date={
												formData.startAt
													? new Date(
															String(
																formData.startAt,
															).replace("Z", ""),
														)
													: undefined
											}
											setDate={(date) =>
												setFormData({
													...formData,
													startAt: date
														? format(
																date,
																"yyyy-MM-dd'T'HH:mm:ss.000'Z'",
															)
														: undefined,
												})
											}
											includeTime={!formData.isFullDay}
											className="h-8 text-sm"
										/>
									) : (
										<div className="font-medium">
											{(() => {
												const dVal =
													task.startDate ||
													task.startAt;
												const d = dVal
													? new Date(
															String(
																dVal,
															).replace("Z", ""),
														)
													: null;
												if (!d) return "Not set";
												return format(
													d,
													task.allDay
														? "PPP"
														: "PPP HH:mm",
												);
											})()}
										</div>
									)}
								</div>
								<div>
									<div className="text-xs text-muted-foreground mb-1">
										End
									</div>
									{isEditing ? (
										<DateTimePicker
											date={
												formData.endAt
													? new Date(
															String(
																formData.endAt,
															).replace("Z", ""),
														)
													: undefined
											}
											setDate={(date) =>
												setFormData({
													...formData,
													endAt: date
														? format(
																date,
																"yyyy-MM-dd'T'HH:mm:ss.000'Z'",
															)
														: undefined,
												})
											}
											includeTime={!formData.isFullDay}
											className="h-8 text-sm"
										/>
									) : (
										<div className="font-medium">
											{(() => {
												const dVal =
													task.endDate || task.endAt;
												const d = dVal
													? new Date(
															String(
																dVal,
															).replace("Z", ""),
														)
													: null;
												if (!d) return "Not set";
												return format(
													d,
													task.allDay
														? "PPP"
														: "PPP HH:mm",
												);
											})()}
										</div>
									)}
								</div>
								{!isEditing && task.durationMin > 0 && (
									<div className="col-span-2 border-t border-dashed border-border pt-2 mt-2 flex justify-between items-center">
										<span className="text-xs text-muted-foreground">
											Duration
										</span>
										<span className="text-sm font-medium">
											{Math.round(task.durationMin / 60)}h{" "}
											{task.durationMin % 60}m
										</span>
									</div>
								)}
							</div>
						</section>

						{/* People Section */}
						<section className="space-y-3">
							<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<UserIcon className="h-4 w-4" /> People
							</h4>
							{isEditing ? (
								<UserSearchMultiSelect
									selectedIds={formData.assigneeIds || []}
									onChange={(ids) =>
										setFormData({
											...formData,
											assigneeIds: ids,
										})
									}
									placeholder="Add people..."
								/>
							) : (
								<div className="flex flex-wrap gap-2">
									{task.assignments?.length > 0 ? (
										task.assignments.map(
											(assignment: any) => (
												<div
													key={
														assignment.assignee?.id
													}
													className="flex items-center gap-2 bg-muted/50 rounded-full pr-3 pl-1 py-1 border border-border"
												>
													<Avatar className="h-6 w-6">
														<AvatarImage
															src={
																assignment
																	.assignee
																	?.image
															}
														/>
														<AvatarFallback className="text-[10px]">
															{assignment.assignee?.name
																?.substring(
																	0,
																	2,
																)
																.toUpperCase() ||
																"??"}
														</AvatarFallback>
													</Avatar>
													<span className="text-xs font-medium">
														{
															assignment.assignee
																?.name
														}
													</span>
												</div>
											),
										)
									) : (
										<span className="text-sm text-muted-foreground italic">
											No one assigned
										</span>
									)}
								</div>
							)}
						</section>

						{/* Resources Section */}
						<section className="space-y-3">
							<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Layers className="h-4 w-4" /> Resources
							</h4>
							<div className="flex flex-wrap gap-2">
								{task.resources?.filter(
									(tr: any) =>
										tr.resource?.resourceType?.code !==
										"PEOPLE",
								).length > 0 ? (
									task.resources
										.filter(
											(tr: any) =>
												tr.resource?.resourceType
													?.code !== "PEOPLE",
										)
										.map((tr: any) => (
											<Badge
												key={tr.resourceId}
												variant="outline"
												className="px-2 py-1 text-xs"
											>
												{tr.resource?.name}
											</Badge>
										))
								) : (
									<span className="text-sm text-muted-foreground italic">
										No resources connected
									</span>
								)}
							</div>
						</section>

						{/* Labels Section */}
						<section className="space-y-3">
							<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Tag className="h-4 w-4" /> Labels
							</h4>
							{isEditing ? (
								<LabelMultiSelect
									selectedSlugs={formData.labelSlugs || []}
									onChange={(slugs) =>
										setFormData({
											...formData,
											labelSlugs: slugs,
										})
									}
									placeholder="Add labels..."
									onLabelCreate={(newLabel) => {
										// We just add it to the form data
										// The new label is created in DB by the LabelMultiSelect component itself typically or we handle it here?
										// LabelMultiSelect creates it via API usually if implemented that way, or just returns new slug.
										// Assuming LabelMultiSelect handles creation of new generic label entities if needed,
										// or if it's just selection, we just update slugs.
									}}
								/>
							) : (
								<div className="flex flex-wrap gap-2">
									{task.labels?.length > 0 ? (
										task.labels.map((taskLabel: any) => (
											<Badge
												key={taskLabel.label?.slug}
												variant="outline"
												className="px-2 py-1 text-xs border-0"
												style={{
													backgroundColor:
														taskLabel.label
															?.color || "#muted",
													color: "#fff",
												}}
											>
												{taskLabel.label?.name}
											</Badge>
										))
									) : (
										<span className="text-sm text-muted-foreground italic">
											No labels
										</span>
									)}
								</div>
							)}
						</section>

						{/* Description Section */}
						<section className="space-y-3">
							<h4 className="text-sm font-medium text-muted-foreground">
								Description
							</h4>
							{isEditing ? (
								<Textarea
									value={formData.description}
									onChange={(e) =>
										setFormData({
											...formData,
											description: e.target.value,
										})
									}
									className="min-h-[120px]"
									placeholder="Add a detailed description..."
								/>
							) : (
								<div className="prose prose-sm dark:prose-invert max-w-none bg-muted/20 p-4 rounded-lg border border-border min-h-[100px]">
									{task.description ? (
										<p className="whitespace-pre-wrap text-sm">
											{task.description}
										</p>
									) : (
										<p className="text-muted-foreground italic text-sm">
											No description provided.
										</p>
									)}
								</div>
							)}
						</section>

						<Separator />

						{/* Comments Section */}
						<section className="space-y-4">
							<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<MessageSquare className="h-4 w-4" /> Comments
							</h4>

							<div className="space-y-4">
								{fullTask?.comments?.length > 0 ? (
									fullTask.comments.map((comment: any) => (
										<div
											key={comment.id}
											className="flex gap-3"
										>
											<Avatar className="h-8 w-8 mt-1">
												<AvatarImage
													src={comment.author?.image}
												/>
												<AvatarFallback>
													{comment.author?.name
														?.substring(0, 2)
														.toUpperCase() || "??"}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 space-y-1">
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium">
														{comment.author?.name ||
															"Unknown"}
													</span>
													<span className="text-xs text-muted-foreground">
														{format(
															new Date(
																comment.createdAt,
															),
															"MMM d, HH:mm",
														)}
													</span>
												</div>
												<div className="text-sm text-foreground bg-muted/30 p-2 rounded-md rounded-tl-none">
													{comment.body}
												</div>
											</div>
										</div>
									))
								) : (
									<div className="text-center py-6 text-muted-foreground text-sm">
										No comments yet.
									</div>
								)}
							</div>

							{/* Add Comment */}
							<div className="flex gap-3 mt-4">
								<Avatar className="h-8 w-8">
									<AvatarFallback>ME</AvatarFallback>
								</Avatar>
								<div className="flex-1 space-y-2">
									<Textarea
										placeholder="Write a comment..."
										className="min-h-[80px] resize-none"
										value={commentText}
										onChange={(e) =>
											setCommentText(e.target.value)
										}
									/>
									<div className="flex justify-end">
										<Button
											size="sm"
											onClick={handleAddComment}
											disabled={
												commenting ||
												!commentText.trim()
											}
										>
											Comment
										</Button>
									</div>
								</div>
							</div>
						</section>

						<Separator />

						{/* Audit Trail Section */}
						<section className="space-y-3 pb-8">
							<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Activity className="h-4 w-4" /> Activity
							</h4>
							<div className="space-y-3 pl-2 border-l-2 border-border ml-2">
								{fullTask?.auditTrail?.length > 0 ? (
									fullTask.auditTrail.map((log: any) => (
										<div
											key={log.id}
											className="relative pl-4 text-sm"
										>
											<div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
											<div className="flex flex-col">
												<span className="font-medium text-xs text-foreground">
													{log.byUser?.name ||
														"System"}{" "}
													<span className="text-muted-foreground font-normal">
														{log.message?.toLowerCase() ||
															log.action}
													</span>
												</span>
												<span className="text-[10px] text-muted-foreground">
													{format(
														new Date(log.at),
														"MMM d, HH:mm",
													)}
												</span>
											</div>
										</div>
									))
								) : (
									<div className="pl-4 text-sm text-muted-foreground">
										No activity recorded.
									</div>
								)}
							</div>
						</section>
					</div>
				</div>

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
