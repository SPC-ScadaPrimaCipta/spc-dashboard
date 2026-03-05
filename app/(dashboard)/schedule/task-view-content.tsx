"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	Clock,
	User as UserIcon,
	Tag,
	MessageSquare,
	Activity,
	Edit,
	Trash2,
	Layers,
	Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DialogTitle } from "@/components/ui/dialog";

interface TaskViewContentProps {
	task: any;
	fullTask: any;
	onEdit: () => void;
	onDelete: () => void;
	onCopy?: (task: any) => void;
	onClose: () => void;
	commentText: string;
	setCommentText: (text: string) => void;
	commenting: boolean;
	onAddComment: () => void;
}

export function TaskViewContent({
	task,
	fullTask,
	onEdit,
	onDelete,
	onCopy,
	onClose,
	commentText,
	setCommentText,
	commenting,
	onAddComment,
}: TaskViewContentProps) {
	return (
		<>
			{/* Header */}
			<div
				className="px-6 py-4 border-b border-border shrink-0 relative transition-colors duration-200"
				style={
					task.color
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
						<div className="flex items-center gap-2 mb-2">
							<Badge
								variant="outline"
								className={cn(
									"capitalize",
									task.status?.name === "Done"
										? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
										: task.status?.name === "In Progress"
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
					</div>

					<div className="flex items-center gap-2">
						{onCopy && (
							<Button
								variant="outline"
								size="sm"
								className="h-8"
								onClick={() => {
									onCopy(task);
									onClose();
								}}
							>
								<Copy className="h-3.5 w-3.5" />
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							className="h-8"
							onClick={onEdit}
						>
							<Edit className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
							onClick={onDelete}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto min-h-0 relative">
				<div className="p-6 space-y-8">
					{/* Schedule Section */}
					<section className="space-y-3">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Clock className="h-4 w-4" /> Schedule
						</h4>
						<div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
							<div>
								<div className="text-xs text-muted-foreground mb-1">
									Start
								</div>
								<div className="font-medium">
									{(() => {
										const dVal =
											task.startDate || task.startAt;
										const d = dVal
											? new Date(
													String(dVal).replace(
														"Z",
														"",
													),
												)
											: null;
										if (!d) return "Not set";
										return format(
											d,
											task.allDay ? "PPP" : "PPP HH:mm",
										);
									})()}
								</div>
							</div>
							<div>
								<div className="text-xs text-muted-foreground mb-1">
									End
								</div>
								<div className="font-medium">
									{(() => {
										const dVal = task.endDate || task.endAt;
										const d = dVal
											? new Date(
													String(dVal).replace(
														"Z",
														"",
													),
												)
											: null;
										if (!d) return "Not set";
										return format(
											d,
											task.allDay ? "PPP" : "PPP HH:mm",
										);
									})()}
								</div>
							</div>
							{task.durationMin > 0 && (
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
						<div className="flex flex-wrap gap-2">
							{task.assignments?.length > 0 ? (
								task.assignments.map((assignment: any) => (
									<div
										key={assignment.assignee?.id}
										className="flex items-center gap-2 bg-muted/50 rounded-full pr-3 pl-1 py-1 border border-border"
									>
										<Avatar className="h-6 w-6">
											<AvatarImage
												src={assignment.assignee?.image}
											/>
											<AvatarFallback className="text-[10px]">
												{assignment.assignee?.name
													?.substring(0, 2)
													.toUpperCase() || "??"}
											</AvatarFallback>
										</Avatar>
										<span className="text-xs font-medium">
											{assignment.assignee?.name}
										</span>
									</div>
								))
							) : (
								<span className="text-sm text-muted-foreground italic">
									No one assigned
								</span>
							)}
						</div>
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
											tr.resource?.resourceType?.code !==
											"PEOPLE",
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
						<div className="flex flex-wrap gap-2">
							{task.labels?.length > 0 ? (
								task.labels.map((taskLabel: any) => (
									<Badge
										key={taskLabel.label?.slug}
										variant="outline"
										className="px-2 py-1 text-xs border-0"
										style={{
											backgroundColor:
												taskLabel.label?.color ||
												"var(--muted)",
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
					</section>

					{/* Description Section */}
					<section className="space-y-3">
						<h4 className="text-sm font-medium text-muted-foreground">
							Description
						</h4>
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
										onClick={onAddComment}
										disabled={
											commenting || !commentText.trim()
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
												{log.byUser?.name || "System"}{" "}
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
		</>
	);
}
