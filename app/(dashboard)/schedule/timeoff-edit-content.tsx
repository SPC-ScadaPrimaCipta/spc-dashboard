"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	Clock,
	User as UserIcon,
	FileText,
	StickyNote,
	Loader2,
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
import { DateTimePicker } from "@/components/date-time-picker";
import { UserSearchMultiSelect } from "@/components/user-search-multiselect";

interface TimeOffEditContentProps {
	request: any;
	onSave: (data: any) => void;
	onCancel: () => void;
	isSaving: boolean;
}

export function TimeOffEditContent({
	request,
	onSave,
	onCancel,
	isSaving,
}: TimeOffEditContentProps) {
	const [formData, setFormData] = useState({
		typeId: request.typeId || "",
		resourceId: request.resourceId || "",
		startAt: request.startAt ? new Date(request.startAt) : new Date(),
		endAt: request.endAt ? new Date(request.endAt) : new Date(),
		allDay: request.allDay ?? true,
		reason: request.reason || "",
		note: request.note || "",
		status: request.status || "DRAFT",
	});

	const [types, setTypes] = useState<any[]>([]);
	const [loadingOptions, setLoadingOptions] = useState(true);

	useEffect(() => {
		async function fetchOptions() {
			try {
				const [typesRes] = await Promise.all([
					fetch("/api/schedule/timeoff-types"), // Assuming this exists or will be created
				]);

				if (typesRes.ok) {
					const data = await typesRes.json();
					setTypes(data.data || []);
				}
			} catch (err) {
				console.error("Error fetching options", err);
			} finally {
				setLoadingOptions(false);
			}
		}
		fetchOptions();
	}, []);

	const handleSave = () => {
		onSave(formData);
	};

	return (
		<>
			{/* Header */}
			<div className="px-6 py-4 border-b border-border shrink-0 bg-muted/30">
				<div className="flex items-center justify-between gap-4">
					<div className="flex-1">
						<Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">
							Time Off Type
						</Label>
						<Select
							value={formData.typeId}
							onValueChange={(val) =>
								setFormData((prev) => ({
									...prev,
									typeId: val,
								}))
							}
						>
							<SelectTrigger className="w-full text-lg font-semibold h-10 border-none px-0 bg-transparent focus-visible:ring-0 shadow-none">
								<SelectValue placeholder="Select type..." />
							</SelectTrigger>
							<SelectContent>
								{types.map((t) => (
									<SelectItem key={t.id} value={t.id}>
										<div className="flex items-center gap-2">
											<div
												className="w-3 h-3 rounded-full"
												style={{
													backgroundColor:
														t.color || "#ccc",
												}}
											/>
											{t.name}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={onCancel}>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={
								isSaving ||
								!formData.typeId ||
								!formData.resourceId
							}
						>
							{isSaving && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Save
						</Button>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto min-h-0 relative">
				<div className="p-6 space-y-8">
					{/* Status & Resource */}
					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								Status
							</Label>
							<Select
								value={formData.status}
								onValueChange={(val) =>
									setFormData((prev) => ({
										...prev,
										status: val,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="DRAFT">Draft</SelectItem>
									<SelectItem value="SUBMITTED">
										Submitted
									</SelectItem>
									<SelectItem value="APPROVED">
										Approved
									</SelectItem>
									<SelectItem value="REJECTED">
										Rejected
									</SelectItem>
									<SelectItem value="CANCELLED">
										Cancelled
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								Requested For
							</Label>
							<UserSearchMultiSelect
								selectedIds={
									formData.resourceId
										? [formData.resourceId]
										: []
								}
								single
								source="RESOURCES"
								placeholder="Select person..."
								onChange={(ids) =>
									setFormData((prev) => ({
										...prev,
										resourceId: ids[0] || "",
									}))
								}
							/>
						</div>
					</div>

					<Separator />

					{/* Schedule Section */}
					<section className="space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
								<Clock className="h-4 w-4" /> Schedule
							</h4>
							<div className="flex items-center gap-2">
								<Checkbox
									id="allDayEdit"
									checked={formData.allDay}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											allDay: !!checked,
										}))
									}
								/>
								<Label
									htmlFor="allDayEdit"
									className="text-xs cursor-pointer"
								>
									All Day
								</Label>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-xs text-muted-foreground">
									Start
								</Label>
								<DateTimePicker
									date={formData.startAt}
									setDate={(date) =>
										setFormData((prev) => ({
											...prev,
											startAt: date || new Date(),
										}))
									}
									includeTime={!formData.allDay}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs text-muted-foreground">
									End
								</Label>
								<DateTimePicker
									date={formData.endAt}
									setDate={(date) =>
										setFormData((prev) => ({
											...prev,
											endAt: date || new Date(),
										}))
									}
									includeTime={!formData.allDay}
								/>
							</div>
						</div>
					</section>

					<Separator />

					{/* Reason Section */}
					<section className="space-y-2">
						<Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<FileText className="h-4 w-4" /> Reason
						</Label>
						<Input
							placeholder="Brief reason (e.g. Vacation, Sick...)"
							value={formData.reason}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									reason: e.target.value,
								}))
							}
						/>
					</section>

					{/* Note Section */}
					<section className="space-y-2 pb-8">
						<Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<StickyNote className="h-4 w-4" /> Note
						</Label>
						<Textarea
							placeholder="Additional details..."
							className="min-h-[120px] resize-none"
							value={formData.note}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									note: e.target.value,
								}))
							}
						/>
					</section>
				</div>
			</div>
		</>
	);
}
