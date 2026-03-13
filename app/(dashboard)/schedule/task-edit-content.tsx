"use client";

import { format } from "date-fns";
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
	Layers,
	Loader2,
	MapPin,
	Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/date-time-picker";
import { LocationSearchSelect } from "@/components/location-search-select";

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

interface TaskEditContentProps {
	task: any;
	fullTask: any;
	formData: any;
	setFormData: (data: any) => void;
	statuses: any[];
	isSaving: boolean;
	onSave: () => void;
	onCancel: () => void;
}

export function TaskEditContent({
	task,
	fullTask,
	formData,
	setFormData,
	statuses,
	isSaving,
	onSave,
	onCancel,
}: TaskEditContentProps) {
	return (
		<>
			{/* Header */}
			<div
				className="px-6 py-4 border-b border-border shrink-0 relative transition-colors duration-200"
				style={{
					backgroundColor: `${formData.color || "#3b82f6"}10`,
					borderLeft: `4px solid ${formData.color || "#3b82f6"}`,
				}}
			>
				<div className="flex items-start justify-between gap-4 pr-6">
					<div className="space-y-3 flex-1">
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Input
									value={formData.title}
									onChange={(e) =>
										setFormData({
											...formData,
											title: e.target.value,
										})
									}
									className="text-lg font-semibold h-10 flex-1"
									placeholder="Task Title"
								/>
							</div>
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
											<SelectItem key={s.id} value={s.id}>
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
										<SelectItem value="LOW">Low</SelectItem>
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
												formData.color === c.value &&
													"ring-2 ring-ring ring-offset-2 scale-110",
											)}
											style={{
												backgroundColor: c.value,
											}}
											title={c.name}
										/>
									))}
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={onCancel}
							className="h-8"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={onSave}
							disabled={isSaving}
							className="h-8"
						>
							{isSaving && (
								<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
							)}
							Save
						</Button>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto min-h-0 relative">
				<div className="p-6 space-y-8">
					{/* Code Section */}
					<section className="space-y-3">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Hash className="h-4 w-4" /> Code
						</h4>
						<Input
							value={formData.code || ""}
							onChange={(e) =>
								setFormData({
									...formData,
									code: e.target.value,
								})
							}
							className="text-sm font-mono max-w-[300px]"
							placeholder="Task code..."
						/>
					</section>

					{/* Schedule Section */}
					<section className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Clock className="h-4 w-4" /> Schedule
							</h4>
							<div className="flex items-center gap-2">
								<Checkbox
									id="full-day"
									checked={formData.isFullDay || false}
									onCheckedChange={(checked) => {
										const isChecked = checked === true;
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
												updates.startAt = format(
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
								<Label htmlFor="full-day">Full Day</Label>
							</div>
						</div>
						<div className="grid gap-4 bg-muted/30 p-4 rounded-lg border border-border grid-cols-1">
							<div>
								<div className="text-xs text-muted-foreground mb-1">
									Start
								</div>
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
									setDate={(date) => {
										let newEndAt = formData.endAt;
										if (date && formData.startAt && formData.endAt) {
											const oldStart = new Date(String(formData.startAt).replace("Z", ""));
											const oldEnd = new Date(String(formData.endAt).replace("Z", ""));
											const duration = oldEnd.getTime() - oldStart.getTime();
											const currentEnd = new Date(String(formData.endAt).replace("Z", ""));
											if (date > currentEnd || date.getTime() > currentEnd.getTime() - 60000) {
												const shiftedEnd = new Date(date.getTime() + (duration > 0 ? duration : 3600000));
												newEndAt = format(shiftedEnd, "yyyy-MM-dd'T'HH:mm:ss.000'Z'");
											}
										}
										setFormData({
											...formData,
											startAt: date
												? format(date, "yyyy-MM-dd'T'HH:mm:ss.000'Z'")
												: undefined,
											endAt: newEndAt,
										});
									}}
									includeTime={!formData.isFullDay}
									className="h-8 text-sm"
								/>
							</div>
							<div>
								<div className="text-xs text-muted-foreground mb-1">
									End
								</div>
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
									minDate={
										formData.startAt
											? new Date(
													String(
														formData.startAt,
													).replace("Z", ""),
												)
											: undefined
									}
									includeTime={!formData.isFullDay}
									className="h-8 text-sm"
								/>
							</div>
						</div>
					</section>

					{/* People Section */}
					<section className="space-y-3">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<UserIcon className="h-4 w-4" /> People
						</h4>
						<UserSearchMultiSelect
							selectedIds={formData.assigneeIds || []}
							onChange={(ids) =>
								setFormData({
									...formData,
									assigneeIds: ids,
								})
							}
							initialOptions={
								formData.assignees?.map((a: any) => ({
									value: a.id,
									label: a.name || "Unknown",
									description: a.email || "-",
								})) || []
							}
							placeholder="Add people..."
						/>
					</section>

					{/* Resources Section - View Only in Edit Mode too? */}
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
					</section>

					{/* Location Section */}
					<section className="space-y-3">
						<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<MapPin className="h-4 w-4" /> Location
						</h4>
						<LocationSearchSelect
							selectedId={formData.locationId}
							onChange={(id) =>
								setFormData({
									...formData,
									locationId: id,
								})
							}
							placeholder="Select location..."
						/>
					</section>

					{/* Description Section */}
					<section className="space-y-3">
						<h4 className="text-sm font-medium text-muted-foreground">
							Description
						</h4>
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
					</section>

					<Separator />

					{/* Comments Section (Static in edit mode) */}
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
