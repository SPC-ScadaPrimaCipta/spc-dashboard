"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ActivityDetailsModal } from "@/app/(dashboard)/schedule/task-detail-modal";
import { TimeOffDetailModal } from "@/app/(dashboard)/schedule/timeoff-detail-modal";
import { TaskQuickCreateModal } from "@/app/(dashboard)/schedule/task-quickcreate-modal";
import { TimeOffQuickCreateModal } from "@/app/(dashboard)/schedule/timeoff-quickcreate-modal";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DayPilot, DayPilotScheduler } from "@daypilot/daypilot-lite-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	calculateDayPilotNewDate,
	formatDayPilotDate,
	getSchedulerProps,
	handleBeforeEventRender,
	handleBeforeRowHeaderRender,
	handleBeforeTimeHeaderRender,
	handleBeforeCellRender,
} from "@/lib/daypilot-utils";
import { ScheduleNavigation } from "@/components/schedule-navigation";
import { useRequirePermission } from "@/hooks/use-require-permission";
const Scheduler: React.FC = () => {
	const [scheduler, setScheduler] = useState<DayPilot.Scheduler>();
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [schedulerHeight, setSchedulerHeight] = useState<number>(400);
	const [resources, setResources] = useState<DayPilot.ResourceData[]>([]);
	const [events, setEvents] = useState<DayPilot.EventData[]>([]);
	const [timeOffEvents, setTimeOffEvents] = useState<DayPilot.EventData[]>(
		[],
	);

	// const { isAuthorized } = useRequirePermission("read", "schedules");

	// use require permissions
	const { isAuthorized: canManageSchedule } = useRequirePermission(
		"manage",
		"schedules",
		{ redirect: false },
	);

	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	// Read initial state from URL or defaults
	const [view, setView] = useState<"Day" | "Week" | "Month" | "Year">(() => {
		const v = searchParams.get("v");
		return (
			["Day", "Week", "Month", "Year"].includes(v as string) ? v : "Month"
		) as any;
	});

	const [startDate, setStartDate] = useState<DayPilot.Date>(() => {
		const d = searchParams.get("date");
		if (d) return new DayPilot.Date(d);
		return new DayPilot.Date().firstDayOfMonth();
	});

	const [resourceType, setResourceType] = useState<string>(
		() => searchParams.get("type") || "PEOPLE",
	);

	const [selectedDivisions, setSelectedDivisions] = useState<string[]>(() =>
		searchParams.getAll("div"),
	);

	const [locationCategory, setLocationCategory] = useState<string>(
		() => searchParams.get("loc") || "ALL",
	);

	const [refreshKey, setRefreshKey] = useState(0);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [useInitials, setUseInitials] = useState<boolean>(false);
	const [isSimplified, setIsSimplified] = useState<boolean>(false);

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isTimeOffModalVisible, setIsTimeOffModalVisible] = useState(false);
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
	const [isTimeOffQuickCreateOpen, setIsTimeOffQuickCreateOpen] =
		useState(false);
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
		const isVerticalMove = args.e.data.resourceId !== args.newResource;
		if (isVerticalMove && !canManageSchedule) {
			toast.error("You do not have permission to reassign resources");
			setRefreshKey((prev) => prev + 1);
			return;
		}

		if (resourceType === "TASK" && isVerticalMove) {
			toast.error(
				"Reassigning resources via drag-and-drop is disabled in Task View.",
			);
			setRefreshKey((prev) => prev + 1);
			return;
		}

		try {
			const eventType = args.e.data.tags?.type || "TASK";
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

			const apiUrl =
				eventType === "TIMEOFF"
					? `/api/timeoff/${args.e.id()}`
					: `/api/tasks/${args.e.data.taskId}`;

			const res = await fetch(apiUrl, {
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
				console.error(`Failed to update ${eventType}`, err);
				toast.error(`Failed to update ${eventType.toLowerCase()}`);
				setRefreshKey((prev) => prev + 1); // Revert by refreshing
			} else {
				toast.success(
					`${eventType === "TIMEOFF" ? "Time off" : "Task"} updated successfully`,
				);
			}
		} catch (error) {
			console.error("Error updating event", error);
			toast.error("Failed to update event");
			setRefreshKey((prev) => prev + 1);
		}
	};

	const onEventResized = async (args: DayPilot.SchedulerEventResizedArgs) => {
		try {
			const eventType = args.e.data.tags?.type || "TASK";
			const payload: any = {};

			console.log(args);

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

			console.log("payload", payload);

			const apiUrl =
				eventType === "TIMEOFF"
					? `/api/timeoff/${args.e.id()}`
					: `/api/tasks/${args.e.data.taskId}`;

			const res = await fetch(apiUrl, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const err = await res.json();
				console.error(`Failed to update ${eventType}`, err);
				toast.error(`Failed to update ${eventType.toLowerCase()}`);
				setRefreshKey((prev) => prev + 1); // Revert by refreshing
			} else {
				toast.success(
					`${eventType === "TIMEOFF" ? "Time off" : "Task"} updated successfully`,
				);
			}
		} catch (error) {
			console.error("Error updating event", error);
			toast.error("Failed to update event");
			setRefreshKey((prev) => prev + 1);
		}
	};

	const onBeforeEventRender = (
		args: DayPilot.SchedulerBeforeEventRenderArgs,
	) => {
		handleBeforeEventRender(args, resourceType, (data) => {
			setClipboard(data);
			toast.success(`Copied task: ${data.text}`);
		});
	};

	const onBeforeRowHeaderRender = (
		args: DayPilot.SchedulerBeforeRowHeaderRenderArgs,
	) => {
		handleBeforeRowHeaderRender(args, resourceType, useInitials);
	};

	const onBeforeTimeHeaderRender = (
		args: DayPilot.SchedulerBeforeTimeHeaderRenderArgs,
	) => {
		handleBeforeTimeHeaderRender(args, view);
	};

	const timeOffMap = useMemo(() => {
		const map = new Map<string, { start: number; end: number }[]>();
		timeOffEvents.forEach((e) => {
			const resId = String(e.resource);
			const list = map.get(resId) || [];
			list.push({
				start: new DayPilot.Date(e.start).getTime(),
				end: new DayPilot.Date(e.end).getTime(),
			});
			map.set(resId, list);
		});
		return map;
	}, [timeOffEvents]);

	const onBeforeCellRender = (
		args: DayPilot.SchedulerBeforeCellRenderArgs,
	) => {
		handleBeforeCellRender(args, view, resourceType, timeOffMap);
	};

	const onTimeRangeSelected = async (
		args: DayPilot.SchedulerTimeRangeSelectedArgs,
	) => {
		scheduler?.clearSelection();

		const selectedResource = resources.find((r) => r.id === args.resource);

		const allowCreate = selectedResource?.tags?.allowCreate;

		if (!allowCreate) {
			toast.error(
				"You do not have permission to create tasks for this resource",
			);
			return;
		}

		const resourceName = selectedResource?.name;

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

		if (resourceType === "TIMEOFF") {
			setIsTimeOffQuickCreateOpen(true);
		} else {
			setIsQuickCreateOpen(true);
		}
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
		const eventType = args.e.data.tags?.type || "TASK";

		if (eventType === "TIMEOFF") {
			setSelectedActivity({
				id: args.e.id(),
				title: args.e.text(),
				startDate: args.e.start().toString(),
				endDate: args.e.end().toString(),
				allDay: args.e.data.tags?.allDay,
			});
			setIsTimeOffModalVisible(true);
		} else {
			setSelectedActivity({
				id: args.e.data.taskId || args.e.id(),
				title: args.e.text(),
				startDate: args.e.start().toString(),
				endDate: args.e.end().toString(),
				allDay: args.e.data.tags?.allDay,
			});
			setIsModalVisible(true);
		}
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
				// 1. Calculate time range (used for both resources and events)
				let days = fetchDays();
				const start = startDate.toString("yyyy-MM-dd");
				const end = startDate.addDays(days).toString("yyyy-MM-dd");

				// 2. Fetch resources
				const resourceParams = new URLSearchParams({
					type: resourceType,
				});
				selectedDivisions.forEach((div) =>
					resourceParams.append("division", div),
				);
				if (locationCategory !== "ALL") {
					resourceParams.append("loc", locationCategory);
				}

				if (resourceType === "TASK") {
					resourceParams.append("start", start);
					resourceParams.append("end", end);
				}

				const resResources = await fetch(
					`/api/schedule/resources?${resourceParams.toString()}`,
				);
				let newResources: any[] = [];
				if (resResources.ok) {
					const jsonRes = await resResources.json();
					if (jsonRes.ok) {
						if (resourceType === "TASK") {
							newResources = jsonRes.data.map((t: any) => ({
								name: t.name,
								id: t.id,
								tags: {
									type: "TASK",
									color: t.color,
								},
							}));
						} else {
							newResources = jsonRes.data.map((r: any) => ({
								name: r.name,
								id: r.id,
								tags: {
									userId: r.userId,
									division: r.user?.profile?.division?.name,
									divisionCode:
										r.user?.profile?.division?.code,
									divisionColor:
										r.user?.profile?.division?.color,
									position: r.user?.profile?.position,
									initials: r.user?.profile?.initials,
									allowCreate: r.allowCreate,
								},
							}));
						}
						setResources(newResources);
					}
				}

				// 3. Fetch events
				const eventParams = new URLSearchParams({
					start: start,
					end: end,
					type: resourceType,
				});
				selectedDivisions.forEach((div) =>
					eventParams.append("division", div),
				);
				if (locationCategory !== "ALL") {
					eventParams.append("loc", locationCategory);
				}

				const resEvents = await fetch(
					`/api/schedule/events?${eventParams.toString()}`,
				);
				if (resEvents.ok) {
					const jsonEvt = await resEvents.json();
					if (jsonEvt.ok) {
						setEvents(jsonEvt.data);
					}
				}

				// 3. Fetch timeoff if resourceType is PEOPLE
				if (resourceType === "PEOPLE") {
					const timeOffParams = new URLSearchParams({
						start: start,
						end: end,
						type: "TIMEOFF",
					});
					selectedDivisions.forEach((div) =>
						timeOffParams.append("division", div),
					);
					if (locationCategory !== "ALL") {
						timeOffParams.append("loc", locationCategory);
					}

					const resTimeOff = await fetch(
						`/api/schedule/events?${timeOffParams.toString()}`,
					);
					if (resTimeOff.ok) {
						const jsonTO = await resTimeOff.json();
						if (jsonTO.ok) {
							setTimeOffEvents(jsonTO.data);
						}
					}
				} else {
					setTimeOffEvents([]);
				}
			} catch (error) {
				console.error("Failed to fetch schedule data", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, [
		startDate,
		view,
		refreshKey,
		resourceType,
		selectedDivisions,
		locationCategory,
	]);

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

	// Keep URL in sync with state
	useEffect(() => {
		const params = new URLSearchParams();
		params.set("v", view);
		params.set("type", resourceType);
		params.set("date", startDate.toString("yyyy-MM-dd"));
		selectedDivisions.forEach((div) => params.append("div", div));
		if (locationCategory !== "ALL") {
			params.set("loc", locationCategory);
		}

		const query = params.toString();
		const url = `${pathname}${query ? `?${query}` : ""}`;

		router.replace(url, { scroll: false });
	}, [view, resourceType, startDate, selectedDivisions, pathname, router]);

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
				isSimplified={isSimplified}
				setIsSimplified={setIsSimplified}
				locationCategory={locationCategory}
				setLocationCategory={setLocationCategory}
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
						eventHeight={40}
						timeHeaders={schedulerProps.timeHeaders}
						cellWidth={schedulerProps.cellWidth}
						rowMarginTop={18}
						rowMarginBottom={4}
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

			<TimeOffDetailModal
				isVisible={isTimeOffModalVisible}
				onClose={() => setIsTimeOffModalVisible(false)}
				activity={selectedActivity}
				onUpdate={() => setRefreshKey((prev) => prev + 1)}
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
				resourceType={resourceType}
			/>

			<TimeOffQuickCreateModal
				isOpen={isTimeOffQuickCreateOpen}
				onClose={() => setIsTimeOffQuickCreateOpen(false)}
				onCreated={() => setRefreshKey((prev) => prev + 1)}
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
