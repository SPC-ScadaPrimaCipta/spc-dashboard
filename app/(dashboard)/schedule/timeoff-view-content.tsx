"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
	Clock,
	User as UserIcon,
	FileText,
	Edit,
	Trash2,
	StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DialogTitle } from "@/components/ui/dialog";

interface TimeOffViewContentProps {
	request: any;
	onEdit: () => void;
	onDelete: () => void;
	onClose: () => void;
}

export function TimeOffViewContent({
	request,
	onEdit,
	onDelete,
	onClose,
}: TimeOffViewContentProps) {
	return (
		<>
			{/* Header */}
			<div
				className="px-6 py-4 border-b border-border shrink-0 relative transition-colors duration-200"
				style={
					request.type?.color
						? {
								backgroundColor: `${request.type.color}10`,
								borderLeft: `4px solid ${request.type.color}`,
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
									request.status === "APPROVED"
										? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
										: request.status === "REJECTED"
											? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
											: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
								)}
							>
								{request.status || "DRAFT"}
							</Badge>
							{/* <Badge
								variant="secondary"
								className="text-xs font-normal"
							>
								{request.type?.name || "Time Off"}
							</Badge> */}
						</div>
						<DialogTitle className="text-xl leading-tight">
							{request.type?.name || "Time Off Request"}
						</DialogTitle>
					</div>

					<div className="flex items-center gap-2">
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
										const dVal = request.startAt;
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
											request.allDay
												? "PPP"
												: "PPP HH:mm",
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
										const dVal = request.endAt;
										const d = dVal
											? new Date(
													String(dVal).replace(
														"Z",
														"",
													),
												)
											: null;
										if (!d) return "Not set";
										console.log(d);
										return format(
											d,
											request.allDay
												? "PPP"
												: "PPP HH:mm",
										);
									})()}
								</div>
							</div>
						</div>
					</section>

					{/* Person Section */}
					<section className="space-y-3">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<UserIcon className="h-4 w-4" /> Requested For
						</h4>
						<div className="flex flex-wrap gap-2">
							{request.resource ? (
								<div className="flex items-center gap-2 bg-muted/50 rounded-full pr-3 pl-1 py-1 border border-border">
									<Avatar className="h-6 w-6">
										<AvatarImage
											src={request.resource.user?.image}
										/>
										<AvatarFallback className="text-[10px]">
											{request.resource.name
												?.substring(0, 2)
												.toUpperCase() || "??"}
										</AvatarFallback>
									</Avatar>
									<span className="text-xs font-medium">
										{request.resource.name}
									</span>
								</div>
							) : (
								<span className="text-sm text-muted-foreground italic">
									No resource assigned
								</span>
							)}
						</div>
					</section>

					{/* Reason Section */}
					<section className="space-y-3">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<FileText className="h-4 w-4" /> Reason
						</h4>
						<div className="bg-muted/20 p-4 rounded-lg border border-border">
							{request.reason ? (
								<p className="text-sm">{request.reason}</p>
							) : (
								<p className="text-muted-foreground italic text-sm">
									No reason provided.
								</p>
							)}
						</div>
					</section>

					{/* Note Section */}
					<section className="space-y-3 pb-8">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<StickyNote className="h-4 w-4" /> Note
						</h4>
						<div className="bg-muted/20 p-4 rounded-lg border border-border min-h-[80px]">
							{request.note ? (
								<p className="whitespace-pre-wrap text-sm">
									{request.note}
								</p>
							) : (
								<p className="text-muted-foreground italic text-sm">
									No notes provided.
								</p>
							)}
						</div>
					</section>
				</div>
			</div>
		</>
	);
}
