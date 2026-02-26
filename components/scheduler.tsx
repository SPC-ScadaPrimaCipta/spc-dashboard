"use client";

import React, { useEffect, useState, useRef } from "react";
import { ActivityDetailsModal } from "@/app/(dashboard)/schedule/task-detail-modal";
import { TaskQuickCreateModal } from "@/app/(dashboard)/schedule/task-quickcreate-modal";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DayPilot, DayPilotScheduler } from "@daypilot/daypilot-lite-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	calculateDayPilotNewDate,
	formatDayPilotDate,
	getSchedulerProps,
	renderPeopleRowHeader,
} from "@/lib/daypilot-utils";
import { ScheduleNavigation } from "@/components/schedule-navigation";
const Scheduler: React.FC = () => {
	const [scheduler, setScheduler] = useState<DayPilot.Scheduler>();
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [schedulerHeight, setSchedulerHeight] = useState<number>(400);
	const [resources, setResources] = useState<DayPilot.ResourceData[]>([]);
	const [events, setEvents] = useState<DayPilot.EventData[]>([]);

	// Default view
	const [view, setView] = useState<"Day" | "Week" | "Month" | "Year">(
		"Month",
	);
	const [startDate, setStartDate] = useState<DayPilot.Date>(
		new DayPilot.Date().firstDayOfMonth(),
	);
	const [refreshKey, setRefreshKey] = useState(0);
	const [resourceType, setResourceType] = useState<string>("PEOPLE");
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [useInitials, setUseInitials] = useState<boolean>(false);
	const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [selectedActivity, setSelectedActivity] = useState<any>(null);

	const [clipboard, setClipboard] = useState<{
		taskId: string;
		durationMin: number;
		text: string;
		allDay?: boolean;
	} | null>(null);

	const [isConfirmCopyOpen, setIsConfirmCopyOpen] = useState(false);
	const [pendingCopyArgs, setPendingCopyArgs] = useState<{
		startAt: string;
		targetResourceId: string;
	} | null>(null);

	const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
	const [quickCreateData, setQuickCreateData] = useState<{
		startAt?: string;
		endAt?: string;
		resourceId?: string;
		resourceName?: string;
	} | null>(null);

	const [hoveredEvent, setHoveredEvent] = useState<{
		title: string;
		start: string;
		end: string;
	} | null>(null);
	const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

	const handleMouseMove = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		const eventEl = target.closest(
			'[class*="dp-custom-event-"]',
		) as HTMLElement;
		if (eventEl) {
			const eventClass = Array.from(eventEl.classList).find((c) =>
				c.startsWith("dp-custom-event-"),
			);
			if (eventClass) {
				const eventId = eventClass.replace("dp-custom-event-", "");
				const ev = events.find((e) => String(e.id) === String(eventId));
				if (ev) {
					const startDP = new DayPilot.Date(ev.start as string);
					const endDP = new DayPilot.Date(ev.end as string);
					const isAllDay = ev.tags?.allDay;
					const formatStr = isAllDay
						? "MMMM d, yyyy"
						: "MMMM d, yyyy h:mm tt";

					let displayEnd = endDP;
					if (
						isAllDay &&
						startDP.toString("yyyy-MM-dd") !==
							endDP.toString("yyyy-MM-dd")
					) {
						// For allDay events backend adds 1 day to end, so subtract it back for display
						displayEnd = endDP.addDays(-1);
					}

					setHoveredEvent({
						title: ev.text,
						start: startDP.toString(formatStr),
						end:
							isAllDay &&
							startDP.toString("yyyy-MM-dd") ===
								displayEnd.toString("yyyy-MM-dd")
								? ""
								: displayEnd.toString(formatStr),
					});
					setTooltipPos({ x: e.clientX, y: e.clientY });
					return;
				}
			}
		}
		if (hoveredEvent) {
			setHoveredEvent(null);
		}
	};

	const handleViewChange = (newView: "Day" | "Week" | "Month" | "Year") => {
		setView(newView);
		// Recalculate start date based on new view if needed (snap)
		let newDate = startDate;
		if (newView === "Week") newDate = newDate.firstDayOfWeek();
		if (newView === "Month") newDate = newDate.firstDayOfMonth();
		if (newView === "Year")
			newDate = new DayPilot.Date(newDate.getYear() + "-01-01");
		setStartDate(newDate);
	};

	const handleNavigate = (direction: "prev" | "next" | "today") => {
		if (direction === "today") {
			const today = new DayPilot.Date();
			let newDate = today;
			if (view === "Week") newDate = today.firstDayOfWeek();
			if (view === "Month") newDate = today.firstDayOfMonth();
			if (view === "Year")
				newDate = new DayPilot.Date(today.getYear() + "-01-01");
			setStartDate(newDate);
			return;
		}

		let newDate = startDate;
		switch (view) {
			case "Day":
				newDate =
					direction === "next"
						? startDate.addDays(1)
						: startDate.addDays(-1);
				break;
			case "Week":
				newDate =
					direction === "next"
						? startDate.addDays(7)
						: startDate.addDays(-7);
				break;
			case "Month":
				newDate =
					direction === "next"
						? startDate.addMonths(1)
						: startDate.addMonths(-1);
				break;
			case "Year":
				newDate =
					direction === "next"
						? startDate.addYears(1)
						: startDate.addYears(-1);
				break;
		}
		setStartDate(newDate);
	};

	const onEventMoved = async (args: DayPilot.SchedulerEventMovedArgs) => {
		try {
			const startAt = calculateDayPilotNewDate(
				view,
				args.newStart,
				args.e.start(),
				"start",
			);
			const endAt = calculateDayPilotNewDate(
				view,
				args.newEnd,
				args.e.end(),
				"end",
			);
			const resourceId = args.newResource;

			const res = await fetch(`/api/tasks/${args.e.data.taskId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					startAt,
					endAt,
					resourceId,
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				console.error("Failed to update task", err);
				toast.error("Failed to update task");
				setRefreshKey((prev) => prev + 1); // Revert by refreshing
			} else {
				const json = await res.json();
				console.log("Task updated successfully", json);
				toast.success("Task updated successfully");
			}
		} catch (error) {
			console.error("Error updating task", error);
			toast.error("Failed to update task");
			setRefreshKey((prev) => prev + 1);
		}
	};

	const onEventResized = async (args: DayPilot.SchedulerEventResizedArgs) => {
		try {
			const payload: any = {};

			if (args.what === "start") {
				payload.startAt = calculateDayPilotNewDate(
					view,
					args.newStart,
					args.e.start(),
					"start",
				);
			} else if (args.what === "end") {
				payload.endAt = calculateDayPilotNewDate(
					view,
					args.newEnd,
					args.e.end(),
					"end",
				);
			}

			const res = await fetch(`/api/tasks/${args.e.data.taskId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const err = await res.json();
				console.error("Failed to update task", err);
				toast.error("Failed to update task");
				setRefreshKey((prev) => prev + 1); // Revert by refreshing
			} else {
				const json = await res.json();
				console.log("Task updated successfully", json);
				toast.success("Task updated successfully");
			}
		} catch (error) {
			console.error("Error updating task", error);
			toast.error("Failed to update task");
			setRefreshKey((prev) => prev + 1);
		}
	};

	const onBeforeEventRender = (
		args: DayPilot.SchedulerBeforeEventRenderArgs,
	) => {
		if (!args.data.backColor) {
			args.data.backColor = "#93c47d";
		}

		// Inject a custom class that holds the event ID for hover tracking
		args.data.cssClass = `dp-custom-event-${args.data.id}`;

		const startDP = new DayPilot.Date(args.data.start as string);
		const endDP = new DayPilot.Date(args.data.end as string);
		const isAllDay = args.data.tags?.allDay;
		const formatStr = isAllDay ? "MMM d, yyyy" : "MMM d, yyyy h:mm tt";

		let displayEnd = endDP;
		if (
			isAllDay &&
			startDP.toString("yyyy-MM-dd") !== endDP.toString("yyyy-MM-dd")
		) {
			// For allDay events backend adds 1 day to end, so subtract it back for display
			displayEnd = endDP.addDays(-1);
		}

		const startDateStr = startDP.toString(formatStr);
		const endDateStr =
			isAllDay &&
			startDP.toString("yyyy-MM-dd") === displayEnd.toString("yyyy-MM-dd")
				? ""
				: displayEnd.toString(formatStr);

		const timeStr = endDateStr
			? `${startDateStr} - ${endDateStr}`
			: startDateStr;

		// Render the title and date directly into the HTML of the event box
		args.data.html = `
			<div class="px-2 py-1 h-full flex flex-col justify-center overflow-hidden">
				<div class="font-semibold text-sm truncate leading-tight">${args.data.text}</div>
				<div class="text-[10px] opacity-90 truncate leading-tight mt-0.5">${timeStr}</div>
			</div>
		`;

		args.data.toolTip = `${args.data.text} - ${timeStr}`;

		args.data.areas = [
			{
				right: 4,
				top: 4,
				width: 24,
				height: 24,
				cssClass: "copy-btn-area",
				style: "display: flex; align-items: center; justify-content: center; background: white; border-radius: 4px; cursor: pointer; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);",
				html: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-600"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
				visibility: "Hover",
				action: "None",
				onClick: (clickArgs: any) => {
					const e = clickArgs.source;
					const startDP = new DayPilot.Date(e.data.start as string);
					const endDP = new DayPilot.Date(e.data.end as string);
					const durationMs = endDP.getTime() - startDP.getTime();
					const durationMin = Math.round(durationMs / 60000);

					setClipboard({
						taskId: e.data.taskId,
						durationMin,
						text: e.text(),
						allDay: e.data.tags?.allDay,
					});
					console.log("clipboard", clipboard);
					toast.success(`Copied task: ${e.text()}`);
				},
			},
		];
	};

	const onBeforeRowHeaderRender = (
		args: DayPilot.SchedulerBeforeRowHeaderRenderArgs,
	) => {
		if (resourceType === "PEOPLE") {
			args.row.html = renderPeopleRowHeader(args.row, useInitials);
		}
	};

	const onBeforeTimeHeaderRender = (
		args: DayPilot.SchedulerBeforeTimeHeaderRenderArgs,
	) => {
		const now = new DayPilot.Date();
		if (view === "Day") {
			if (
				args.header.start.getTime() <= now.getTime() &&
				now.getTime() <
					(args.header.end?.getTime() ??
						args.header.start.addHours(1).getTime())
			) {
				args.header.backColor = "#e0f2fe"; // Light blue
			}
		} else {
			const today = now.getDatePart();
			if (args.header.start.getDatePart().getTime() === today.getTime()) {
				args.header.backColor = "#e0f2fe"; // Light blue
			}
		}
	};

	const onBeforeCellRender = (
		args: DayPilot.SchedulerBeforeCellRenderArgs,
	) => {
		const now = new DayPilot.Date();
		if (view === "Day") {
			if (
				args.cell.start.getTime() <= now.getTime() &&
				now.getTime() < args.cell.end.getTime()
			) {
				args.cell.properties.backColor = "#f0f9ff"; // Lighter blue
			}
		} else {
			const today = now.getDatePart();
			if (args.cell.start.getDatePart().getTime() === today.getTime()) {
				args.cell.properties.backColor = "#f0f9ff"; // Lighter blue
			}
		}
	};

	const onTimeRangeSelected = async (
		args: DayPilot.SchedulerTimeRangeSelectedArgs,
	) => {
		scheduler?.clearSelection();

		const resourceName = resources.find(
			(r) => r.id === args.resource,
		)?.name;

		if (clipboard) {
			setPendingCopyArgs({
				startAt: formatDayPilotDate(args.start),
				targetResourceId: String(args.resource),
			});
			setIsConfirmCopyOpen(true);
			return;
		}

		setQuickCreateData({
			startAt: formatDayPilotDate(args.start),
			endAt: formatDayPilotDate(args.end),
			resourceId: String(args.resource), // Assuming args.resource can be string or numeric ID
			resourceName: resourceName || String(args.resource),
		});

		setIsQuickCreateOpen(true);
		console.log("Time range selected", args);
	};

	const handleConfirmCopy = async () => {
		if (!clipboard || !pendingCopyArgs) return;

		setIsLoading(true);
		try {
			const res = await fetch(
				`/api/tasks/${clipboard.taskId}/duplicate`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						startAt: pendingCopyArgs.startAt,
						targetResourceId: pendingCopyArgs.targetResourceId,
						resourceMode: "REPLACE",
						durationMin: clipboard.durationMin,
					}),
				},
			);

			if (!res.ok) {
				throw new Error("Failed to duplicate task");
			}

			toast.success(`Task duplicated: ${clipboard.text}`);
			setRefreshKey((prev) => prev + 1);
			setClipboard(null);
		} catch (error) {
			console.error("Error duplicating task", error);
			toast.error("Failed to duplicate task");
		} finally {
			setIsLoading(false);
			setIsConfirmCopyOpen(false);
			setPendingCopyArgs(null);
		}
	};

	const onEventClicked = async (args: DayPilot.SchedulerEventClickedArgs) => {
		setSelectedActivity({
			id: args.e.data.taskId,
			title: args.e.text(),
			startDate: args.e.start().toString(),
			endDate: args.e.end().toString(),
			allDay: args.e.data.tags?.allDay,
			// Add more properties if needed by the modal to fetch details or display initial info
		});
		setIsModalVisible(true);
	};

	const handleCopyFromModal = (taskEntity: any) => {
		const startDate = taskEntity.startAt || taskEntity.startDate;
		const endDate = taskEntity.endAt || taskEntity.endDate;

		if (!startDate || !endDate) {
			toast.error("Cannot copy task without start and end dates.");
			return;
		}

		const startDP = new DayPilot.Date(startDate as string);
		const endDP = new DayPilot.Date(endDate as string);
		const durationMs = endDP.getTime() - startDP.getTime();
		const durationMin = Math.round(durationMs / 60000);

		setClipboard({
			taskId: taskEntity.id,
			durationMin,
			text: taskEntity.title,
			allDay: taskEntity.allDay || taskEntity.isFullDay,
		});
		toast.success(`Copied task: ${taskEntity.title}`);
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			try {
				// 1. Fetch resources
				const resourceParams = new URLSearchParams({
					type: resourceType,
				});
				selectedDivisions.forEach((div) =>
					resourceParams.append("division", div),
				);

				const resResources = await fetch(
					`/api/schedule/resources?${resourceParams.toString()}`,
				);
				let newResources: any[] = [];
				if (resResources.ok) {
					const jsonRes = await resResources.json();
					if (jsonRes.ok) {
						newResources = jsonRes.data.map((r: any) => ({
							name: r.name,
							id: r.id,
							tags: {
								division: r.user?.profile?.division?.name,
								divisionCode: r.user?.profile?.division?.code,
								divisionColor: r.user?.profile?.division?.color,
								position: r.user?.profile?.position,
								initials: r.user?.profile?.initials,
							},
						}));
						setResources(newResources);
					}
				}

				// 2. Fetch events
				let days = fetchDays();
				const start = startDate.toString("yyyy-MM-dd");
				const end = startDate.addDays(days).toString("yyyy-MM-dd");

				const eventParams = new URLSearchParams({
					start: start,
					end: end,
					type: resourceType,
				});
				selectedDivisions.forEach((div) =>
					eventParams.append("division", div),
				);

				const resEvents = await fetch(
					`/api/schedule/events?${eventParams.toString()}`,
				);
				if (resEvents.ok) {
					const jsonEvt = await resEvents.json();
					if (jsonEvt.ok) {
						setEvents(jsonEvt.data);
					}
				}
			} catch (error) {
				console.error("Failed to fetch schedule data", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, [startDate, view, refreshKey, resourceType, selectedDivisions]);

	useEffect(() => {
		if (!wrapperRef.current) return;

		// Initial height
		setSchedulerHeight(wrapperRef.current.getBoundingClientRect().height);

		const observer = new ResizeObserver((entries) => {
			for (let entry of entries) {
				// Use bounding client rect to include any box-sizing details or simply contentRect
				setSchedulerHeight(entry.contentRect.height);
			}
		});
		observer.observe(wrapperRef.current);
		return () => observer.disconnect();
	}, []);

	const fetchDays = () => {
		let days = 0;
		switch (view) {
			case "Day":
				days = 1;
				break;
			case "Week":
				days = 7;
				break;
			case "Month":
				days = startDate.daysInMonth();
				break;
			case "Year":
				days = startDate.daysInYear();
				break;
		}
		return days;
	};

	const handleExport = (format: "json" | "xlsx") => {
		let days = fetchDays();
		const start = startDate.toString("yyyy-MM-dd");
		const end = startDate.addDays(days).toString("yyyy-MM-dd");
		const url = `/api/schedule/events/export?start=${start}&end=${end}&type=${resourceType}&filetype=${format}`;
		window.open(url, "_blank");
	};

	const schedulerProps = getSchedulerProps(view, startDate);

	return (
		<div className="flex flex-col h-full gap-4">
			<ScheduleNavigation
				view={view}
				handleViewChange={handleViewChange}
				handleNavigate={handleNavigate}
				startDate={startDate}
				resourceType={resourceType}
				setResourceType={setResourceType}
				onExport={handleExport}
				useInitials={useInitials}
				setUseInitials={setUseInitials}
				selectedDivisions={selectedDivisions}
				setSelectedDivisions={setSelectedDivisions}
				clipboard={clipboard}
				onCancelCopy={() => setClipboard(null)}
			/>

			<div
				className="flex-1 border relative min-h-0 dp-wrapper"
				ref={wrapperRef}
				// className="flex-1 border overflow-hidden relative min-h-0 dp-wrapper"
				// onMouseMove={handleMouseMove}
				// onMouseLeave={() => setHoveredEvent(null)}
			>
				{isLoading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
						<Loader2 className="h-10 w-10 animate-spin text-primary" />
					</div>
				)}
				<div>
					<DayPilotScheduler
						controlRef={setScheduler}
						heightSpec="Max"
						height={Math.max(100, schedulerHeight - 62)} // 60px headers + 2px border pad
						startDate={startDate}
						days={schedulerProps.days}
						scale={schedulerProps.scale}
						eventHeight={70}
						timeHeaders={schedulerProps.timeHeaders}
						cellWidth={schedulerProps.cellWidth}
						rowMarginTop={2}
						rowMarginBottom={2}
						resources={resources}
						events={events}
						onEventMoved={onEventMoved}
						onEventResized={onEventResized}
						onTimeRangeSelected={onTimeRangeSelected}
						onEventClicked={onEventClicked}
						onBeforeEventRender={onBeforeEventRender}
						onBeforeRowHeaderRender={onBeforeRowHeaderRender}
						onBeforeTimeHeaderRender={onBeforeTimeHeaderRender}
						onBeforeCellRender={onBeforeCellRender}
						durationBarVisible={false}
						rowHeaderWidth={useInitials ? 60 : 150}
					/>
				</div>
			</div>

			<ActivityDetailsModal
				isVisible={isModalVisible}
				onClose={() => setIsModalVisible(false)}
				activity={selectedActivity}
				onEdit={() => {}}
				onUpdate={() => setRefreshKey((prev) => prev + 1)}
				onCopy={handleCopyFromModal}
			/>

			<TaskQuickCreateModal
				isOpen={isQuickCreateOpen}
				onClose={() => setIsQuickCreateOpen(false)}
				onTaskCreated={() => setRefreshKey((prev) => prev + 1)}
				resourceId={quickCreateData?.resourceId}
				resourceName={quickCreateData?.resourceName}
				startAt={quickCreateData?.startAt}
				endAt={quickCreateData?.endAt}
				view={view}
			/>

			{hoveredEvent && (
				<div
					className="fixed z-50 pointer-events-none bg-popover text-popover-foreground rounded-md border shadow-md px-3 py-2 text-sm animate-in fade-in-0 zoom-in-95 max-w-xs"
					style={{
						left: tooltipPos.x + 15,
						top: tooltipPos.y + 15,
					}}
				>
					<div className="font-semibold">{hoveredEvent.title}</div>
					<div className="text-xs text-muted-foreground mt-1">
						{hoveredEvent.start}
						{hoveredEvent.end ? ` - ${hoveredEvent.end}` : ""}
					</div>
				</div>
			)}

			<ConfirmationDialog
				open={isConfirmCopyOpen}
				onOpenChange={setIsConfirmCopyOpen}
				title="Confirm Schedule Duplication"
				description={`Are you sure you want to copy the task "${clipboard?.text}" to this selected time slot?`}
				confirmText="Copy Task"
				onConfirm={handleConfirmCopy}
				loading={isLoading}
			/>
		</div>
	);
};

export default Scheduler;
