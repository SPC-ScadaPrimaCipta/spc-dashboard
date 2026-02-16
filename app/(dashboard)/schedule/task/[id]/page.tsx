"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
	Clock,
	Calendar,
	User as UserIcon,
	Tag,
	MessageSquare,
	Paperclip,
	History,
	ArrowLeft,
	Filter,
	Download,
	Trash2,
	Plus,
	Loader2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { UserSearchMultiSelect } from "@/components/user-search-multiselect";
import { LabelMultiSelect } from "@/components/label-multi-select";
import { DateTimePicker } from "@/components/date-time-picker";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import Link from "next/link";

export default function TaskDetailPage() {
	const params = useParams();
	const taskId = params.id as string;
	const router = useRouter();

	const [task, setTask] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<any>({});
	const [statuses, setStatuses] = useState<any[]>([]);
	const [saving, setSaving] = useState(false);

	// Delete State
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Comments State
	const [comments, setComments] = useState<any[]>([]);
	const [commentsPage, setCommentsPage] = useState(1);
	const [commentsTotalPages, setCommentsTotalPages] = useState(1);
	const [commentText, setCommentText] = useState("");
	const [commentsLoading, setCommentsLoading] = useState(false);

	// Audit Trail State
	const [auditLogs, setAuditLogs] = useState<any[]>([]);
	const [auditPage, setAuditPage] = useState(1);
	const [auditTotalPages, setAuditTotalPages] = useState(1);
	const [auditFilters, setAuditFilters] = useState<any>({
		action: null,
		userId: null,
	});
	const [auditLoading, setAuditLoading] = useState(false);

	// Attachments State
	const [attachments, setAttachments] = useState<any[]>([]);

	const fetchTask = useCallback(async () => {
		try {
			setLoading(true);
			const res = await fetch(`/api/tasks/${taskId}`);
			const json = await res.json();
			if (json.ok) {
				setTask(json.data);
				// Initialize form data
				const t = json.data;
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
					isFullDay:
						(t.startAt || t.startDate) &&
						(t.endAt || t.endDate) &&
						new Date(t.startAt || t.startDate).getHours() === 0 &&
						new Date(t.startAt || t.startDate).getMinutes() === 0 &&
						new Date(t.endAt || t.endDate).getHours() === 0 &&
						new Date(t.endAt || t.endDate).getMinutes() === 0,
				});
				setAttachments(t.attachments || []); // Assume attachments come with task for now
			} else {
				toast.error("Failed to load task");
			}
		} catch (error) {
			console.error(error);
			toast.error("Error loading task");
		} finally {
			setLoading(false);
		}
	}, [taskId]);

	const fetchComments = useCallback(async () => {
		try {
			setCommentsLoading(true);
			const res = await fetch(
				`/api/tasks/${taskId}/comments?page=${commentsPage}&limit=5`,
			);
			const json = await res.json();
			// Mocking pagination if API doesn't support it yet structure-wise
			if (json.ok) {
				setComments(json.data || []);
				setCommentsTotalPages(json.pagination?.totalPages || 1);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setCommentsLoading(false);
		}
	}, [taskId, commentsPage]);

	const fetchAuditLogs = useCallback(async () => {
		try {
			setAuditLoading(true);
			const query = new URLSearchParams({
				page: auditPage.toString(),
				limit: "10",
			});
			if (auditFilters.action)
				query.append("action", auditFilters.action);
			if (auditFilters.userId)
				query.append("userId", auditFilters.userId);

			const res = await fetch(
				`/api/tasks/${taskId}/audits?${query.toString()}`,
			);
			const json = await res.json();
			if (json.ok) {
				setAuditLogs(json.data || []);
				setAuditTotalPages(json.pagination?.totalPages || 1);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setAuditLoading(false);
		}
	}, [taskId, auditPage, auditFilters]);

	useEffect(() => {
		if (taskId) {
			fetchTask();
			fetchComments();
			fetchAuditLogs();
			// Load statuses
			fetch("/api/task-statuses")
				.then((res) => res.json())
				.then((data) => {
					if (data.ok) setStatuses(data.data);
				});
		}
	}, [taskId, fetchTask, fetchComments, fetchAuditLogs]);

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetch(`/api/tasks/${taskId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});
			if (res.ok) {
				toast.success("Task updated");
				setIsEditing(false);
				fetchTask();
			} else {
				toast.error("Failed to update");
			}
		} catch (error) {
			toast.error("Error saving");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const res = await fetch(`/api/tasks/${taskId}`, {
				method: "DELETE",
			});
			if (res.ok) {
				toast.success("Task deleted");
				router.push("/schedule");
				router.refresh();
			} else {
				toast.error("Failed to delete task");
			}
		} catch (error) {
			toast.error("Error deleting task");
		} finally {
			setIsDeleting(false);
			setDeleteOpen(false);
		}
	};

	const postComment = async () => {
		if (!commentText.trim()) return;
		try {
			const res = await fetch(`/api/tasks/${taskId}/comments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ body: commentText }),
			});
			if (res.ok) {
				setCommentText("");
				fetchComments();
				toast.success("Comment added");
			}
		} catch (error) {
			toast.error("Failed to post comment");
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!task) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4">
				<p className="text-muted-foreground">Task not found</p>
				<Link href="/schedule">
					<Button variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to Schedule
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col">
			{/* Top Bar */}
			<header className="border rounded-lg bg-muted/20 sticky top-0 z-10 backdrop-blur-sm">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Link href="/schedule">
							<Button variant="ghost" size="icon">
								<ArrowLeft className="h-5 w-5" />
							</Button>
						</Link>
						<div className="flex flex-col">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span>Task</span>
								<span>/</span>
								<span>{task.id.substring(0, 8)}</span>
							</div>
							<h1 className="text-lg font-semibold leading-none">
								{task.title}
							</h1>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{!isEditing && (
							<Button
								variant="ghost"
								size="icon"
								className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-2"
								onClick={() => setDeleteOpen(true)}
							>
								<Trash2 className="h-5 w-5" />
							</Button>
						)}
						{isEditing ? (
							<>
								<Button
									variant="ghost"
									onClick={() => setIsEditing(false)}
								>
									Cancel
								</Button>
								<Button onClick={handleSave} disabled={saving}>
									{saving && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Save Changes
								</Button>
							</>
						) : (
							<Button onClick={() => setIsEditing(true)}>
								Edit Task
							</Button>
						)}
					</div>
				</div>
			</header>

			<main className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Left Column: Main Details */}
				<div className="lg:col-span-2 space-y-8">
					{/* Description Card */}
					<Card>
						<CardHeader>
							<CardTitle>Description</CardTitle>
						</CardHeader>
						<CardContent>
							{isEditing ? (
								<div className="space-y-4">
									<div>
										<Label
											htmlFor="title"
											className="mb-2 block"
										>
											Title
										</Label>
										<Input
											id="title"
											value={formData.title}
											onChange={(e) =>
												setFormData({
													...formData,
													title: e.target.value,
												})
											}
											className="text-lg font-semibold h-12"
											placeholder="Task Title"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="desc">
											Description
										</Label>
										<Textarea
											id="desc"
											value={formData.description}
											onChange={(e) =>
												setFormData({
													...formData,
													description: e.target.value,
												})
											}
											className="min-h-[200px]"
											placeholder="Add a detailed description..."
										/>
									</div>
								</div>
							) : (
								<div>
									<h2 className="text-xl font-semibold mb-4">
										{task.title}
									</h2>
									<div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
										{task.description || (
											<span className="text-muted-foreground italic">
												No description provided.
											</span>
										)}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Comments Section */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<MessageSquare className="h-5 w-5" /> Comments
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Comment Input */}
							<div className="flex gap-4">
								<Avatar>
									<AvatarFallback>ME</AvatarFallback>
								</Avatar>
								<div className="flex-1 space-y-2">
									<Textarea
										value={commentText}
										onChange={(e) =>
											setCommentText(e.target.value)
										}
										placeholder="Write a comment..."
										className="min-h-[100px]"
									/>
									<div className="flex justify-end">
										<Button size="sm" onClick={postComment}>
											Post Comment
										</Button>
									</div>
								</div>
							</div>

							<Separator />

							{/* Comments List */}
							{commentsLoading ? (
								<div className="flex justify-center py-4">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : comments.length > 0 ? (
								<div className="space-y-6">
									{comments.map((comment) => (
										<div
											key={comment.id}
											className="flex gap-4"
										>
											<Avatar className="h-8 w-8">
												<AvatarImage
													src={comment.author?.image}
												/>
												<AvatarFallback>
													{comment.author?.name
														?.substring(0, 2)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 space-y-1">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														<span className="font-semibold text-sm">
															{
																comment.author
																	?.name
															}
														</span>
														<span className="text-xs text-muted-foreground">
															{comment.createdAt &&
															!isNaN(
																new Date(
																	comment.createdAt,
																).getTime(),
															)
																? format(
																		new Date(
																			comment.createdAt,
																		),
																		"PPP HH:mm",
																	)
																: "N/A"}
														</span>
													</div>
												</div>
												<div className="text-sm">
													{comment.body}
												</div>
											</div>
										</div>
									))}

									{/* Pagination */}
									{commentsTotalPages > 1 && (
										<div className="flex items-center justify-center gap-2 pt-4">
											<Button
												variant="outline"
												size="sm"
												disabled={commentsPage === 1}
												onClick={() =>
													setCommentsPage((p) =>
														Math.max(1, p - 1),
													)
												}
											>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<span className="text-sm text-muted-foreground">
												Page {commentsPage} of{" "}
												{commentsTotalPages}
											</span>
											<Button
												variant="outline"
												size="sm"
												disabled={
													commentsPage ===
													commentsTotalPages
												}
												onClick={() =>
													setCommentsPage((p) =>
														Math.min(
															commentsTotalPages,
															p + 1,
														),
													)
												}
											>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									)}
								</div>
							) : (
								<div className="text-center py-8 text-muted-foreground text-sm">
									No comments yet.
								</div>
							)}
						</CardContent>
					</Card>

					{/* Audit Trail Section */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<History className="h-5 w-5" /> Audit Trail
							</CardTitle>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm">
										<Filter className="mr-2 h-4 w-4" />{" "}
										Filter
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuLabel>
										Filter by Action
									</DropdownMenuLabel>
									<DropdownMenuCheckboxItem
										checked={auditFilters.action === null}
										onCheckedChange={() =>
											setAuditFilters({
												...auditFilters,
												action: null,
											})
										}
									>
										All Actions
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={
											auditFilters.action === "UPDATE"
										}
										onCheckedChange={() =>
											setAuditFilters({
												...auditFilters,
												action: "UPDATE",
											})
										}
									>
										Updates
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={
											auditFilters.action ===
											"STATUS_CHANGE"
										}
										onCheckedChange={() =>
											setAuditFilters({
												...auditFilters,
												action: "STATUS_CHANGE",
											})
										}
									>
										Status Changes
									</DropdownMenuCheckboxItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</CardHeader>
						<CardContent>
							{auditLoading ? (
								<div className="flex justify-center py-4">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : (
								<div className="space-y-3 pl-2 border-l-2 border-border ml-2">
									{auditLogs.length > 0 ? (
										auditLogs.map((log) => (
											<div
												key={log.id}
												className="relative pl-4 text-sm"
											>
												<div className="absolute -left-[13px] top-1.5 w-2 h-2 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
												<div className="flex flex-col">
													<div className="font-medium text-sm text-foreground">
														{log.actor?.name ||
															"System"}{" "}
														<span className="text-muted-foreground font-normal">
															{log.message?.toLowerCase() ||
																log.action}
														</span>
													</div>
													<div className="text-xs text-muted-foreground mt-0.5">
														{log.at &&
														!isNaN(
															new Date(
																log.at,
															).getTime(),
														)
															? format(
																	new Date(
																		log.at,
																	),
																	"PPP HH:mm",
																)
															: "N/A"}
													</div>
												</div>
											</div>
										))
									) : (
										<div className="pl-4 text-sm text-muted-foreground">
											No history records found.
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Meta & Sidebar */}
				<div className="space-y-6">
					{/* Meta Card */}
					<Card>
						<CardHeader>
							<CardTitle>Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Status & Priority */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<span className="text-xs text-muted-foreground font-medium">
										Status
									</span>
									{isEditing ? (
										<Select
											value={formData.statusId}
											onValueChange={(val) =>
												setFormData({
													...formData,
													statusId: val,
												})
											}
										>
											<SelectTrigger>
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
									) : (
										<div>
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
												{task.status?.name ||
													"No Status"}
											</Badge>
										</div>
									)}
								</div>
								<div className="space-y-2">
									<span className="text-xs text-muted-foreground font-medium">
										Priority
									</span>
									{isEditing ? (
										<Select
											value={formData.priority}
											onValueChange={(val) =>
												setFormData({
													...formData,
													priority: val,
												})
											}
										>
											<SelectTrigger>
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
									) : (
										<div>
											<Badge
												variant="secondary"
												className="font-normal"
											>
												{task.priority || "MEDIUM"}
											</Badge>
										</div>
									)}
								</div>
							</div>

							<Separator />

							{/* Schedule */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-medium flex items-center gap-2">
										<Clock className="h-4 w-4" /> Schedule
									</h4>
									{isEditing && (
										<div className="flex items-center gap-2">
											<Checkbox
												id="full-day-page"
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
																formData.startAt,
															);
															s.setHours(
																0,
																0,
																0,
																0,
															);
															updates.startAt =
																s.toISOString();
														}
														if (formData.endAt) {
															const e = new Date(
																formData.endAt,
															);
															e.setHours(
																0,
																0,
																0,
																0,
															);
															updates.endAt =
																e.toISOString();
														}
													}
													setFormData({
														...formData,
														...updates,
													});
												}}
											/>
											<Label htmlFor="full-day-page">
												Full Day
											</Label>
										</div>
									)}
								</div>

								<div className="grid gap-4">
									<div>
										<span className="text-xs text-muted-foreground block mb-1">
											Start
										</span>
										{isEditing ? (
											<DateTimePicker
												date={
													formData.startAt
														? new Date(
																formData.startAt,
															)
														: undefined
												}
												setDate={(date) =>
													setFormData({
														...formData,
														startAt:
															date?.toISOString(),
													})
												}
												includeTime={
													!formData.isFullDay
												}
											/>
										) : (
											<div className="font-medium">
												{task.startAt || task.startDate
													? format(
															new Date(
																task.startAt ||
																	task.startDate,
															),
															formData.isFullDay
																? "PPP"
																: "PPP HH:mm",
														)
													: "Not set"}
											</div>
										)}
									</div>
									<div>
										<span className="text-xs text-muted-foreground block mb-1">
											End
										</span>
										{isEditing ? (
											<DateTimePicker
												date={
													formData.endAt
														? new Date(
																formData.endAt,
															)
														: undefined
												}
												setDate={(date) =>
													setFormData({
														...formData,
														endAt: date?.toISOString(),
													})
												}
												includeTime={
													!formData.isFullDay
												}
											/>
										) : (
											<div className="font-medium">
												{task.endAt || task.endDate
													? format(
															new Date(
																task.endAt ||
																	task.endDate,
															),
															formData.isFullDay
																? "PPP"
																: "PPP HH:mm",
														)
													: "Not set"}
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* People */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<UserIcon className="h-4 w-4" /> People
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isEditing ? (
								<UserSearchMultiSelect
									selectedIds={formData.assigneeIds || []}
									onChange={(ids) =>
										setFormData({
											...formData,
											assigneeIds: ids,
										})
									}
									placeholder="Add assignments..."
								/>
							) : (
								<div className="flex flex-wrap gap-2">
									{task.assignments?.map((a: any) => (
										<div
											key={a.assignee?.id}
											className="flex items-center gap-2 bg-muted/50 rounded-full pr-3 pl-1 py-1 border"
										>
											<Avatar className="h-6 w-6">
												<AvatarImage
													src={a.assignee?.image}
												/>
												<AvatarFallback>
													{a.assignee?.name
														?.substring(0, 2)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="text-xs font-medium">
												{a.assignee?.name}
											</span>
										</div>
									))}
									{(!task.assignments ||
										task.assignments.length === 0) && (
										<p className="text-sm text-muted-foreground italic">
											No one assigned
										</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Labels */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Tag className="h-4 w-4" /> Labels
							</CardTitle>
						</CardHeader>
						<CardContent>
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
								/>
							) : (
								<div className="flex flex-wrap gap-2">
									{task.labels?.map((l: any) => (
										<Badge
											key={l.label?.id}
											variant="secondary"
											className="rounded-sm"
											style={{
												backgroundColor: l.label?.color
													? `${l.label.color}20`
													: undefined,
												color: l.label?.color,
												borderColor: l.label?.color
													? `${l.label.color}40`
													: undefined,
											}}
										>
											{l.label?.name}
										</Badge>
									))}
									{(!task.labels ||
										task.labels.length === 0) && (
										<p className="text-sm text-muted-foreground italic">
											No labels
										</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Attachments (New) */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Paperclip className="h-4 w-4" /> Attachments
							</CardTitle>
							<Button variant="ghost" size="sm">
								<Plus className="h-3 w-3 mr-1" /> Add
							</Button>
						</CardHeader>
						<CardContent>
							{attachments.length > 0 ? (
								<div className="space-y-2">
									{attachments.map((file, idx) => (
										<div
											key={idx}
											className="flex items-center justify-between p-2 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors"
										>
											<div className="flex items-center gap-3 overflow-hidden">
												<div className="h-8 w-8 rounded bg-background border flex items-center justify-center shrink-0">
													<Paperclip className="h-4 w-4 text-muted-foreground" />
												</div>
												<div className="truncate">
													<p className="text-sm font-medium truncate">
														{file.name ||
															"Attachment"}
													</p>
													<p className="text-xs text-muted-foreground">
														{file.size ||
															"Unknown size"}
													</p>
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="shrink-0"
											>
												<Download className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							) : (
								<div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
									<Paperclip className="h-8 w-8 opacity-50" />
									<p className="text-xs">No attachments</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</main>

			<ConfirmationDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onConfirm={handleDelete}
				title="Delete Task"
				description="Are you sure you want to delete this task? This action cannot be undone."
				confirmText="Delete"
				loading={isDeleting}
				variant="destructive"
			/>
		</div>
	);
}
