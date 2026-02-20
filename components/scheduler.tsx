"use client";

import React, { useEffect, useState } from "react";
import { ActivityDetailsModal } from "@/app/(dashboard)/schedule/task-detail-modal";
import { TaskQuickCreateModal } from "@/app/(dashboard)/schedule/task-quickcreate-modal";
import { DayPilot, DayPilotScheduler } from "@daypilot/daypilot-lite-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	ChevronLeft,
	ChevronRight,
	Calendar as CalendarIcon,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
	calculateDayPilotNewDate,
	formatDayPilotDate,
} from "@/lib/daypilot-utils";
import { ScheduleNavigation } from "@/components/schedule-navigation";

const Scheduler: React.FC = () => {
	const [scheduler, setScheduler] = useState<DayPilot.Scheduler>();

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
	const [resourceType, setResourceType] = useState<string>("ROOM");
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [selectedActivity, setSelectedActivity] = useState<any>(null);

	const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
	const [quickCreateData, setQuickCreateData] = useState<{
		startAt?: string;
		endAt?: string;
		resourceId?: string;
		resourceName?: string;
	} | null>(null);

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
			console.log("args", args);
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

			const res = await fetch(`/api/tasks/${args.e.id()}`, {
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
			console.log("args", args);
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

			const res = await fetch(`/api/tasks/${args.e.id()}`, {
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

		// if (view === "Month") {
		// 	args.data.text = (args.data.text || "").slice(0, 8) + "…";
		// }

		// (args.data as any).toolTip = args.data.text;
		args.data.areas = [
			// {
			// 	top: 14,
			// 	right: 4,
			// 	width: 20,
			// 	height: 20,
			// 	symbol: "/icons/daypilot.svg#trash",
			// 	fontColor: "#999999",
			// 	onClick: (args) => {
			// 		const e = args.source;
			// 		scheduler?.events.remove(e);
			// 	},
			// },
		];
	};

	const onTimeRangeSelected = async (
		args: DayPilot.SchedulerTimeRangeSelectedArgs,
	) => {
		scheduler?.clearSelection();

		const resourceName = resources.find(
			(r) => r.id === args.resource,
		)?.name;
		setQuickCreateData({
			startAt: formatDayPilotDate(args.start),
			endAt: formatDayPilotDate(args.end),
			resourceId: String(args.resource), // Assuming args.resource can be string or numeric ID
			resourceName: resourceName || String(args.resource),
		});

		setIsQuickCreateOpen(true);
		console.log("Time range selected", args);
	};

	const onEventClicked = async (args: DayPilot.SchedulerEventClickedArgs) => {
		setSelectedActivity({
			id: args.e.id(),
			title: args.e.text(),
			// Add more properties if needed by the modal to fetch details or display initial info
		});
		setIsModalVisible(true);
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			try {
				// 1. Fetch resources
				const resResources = await fetch(
					`/api/schedule/resources?type=${resourceType}`,
				);
				let newResources: any[] = [];
				if (resResources.ok) {
					const jsonRes = await resResources.json();
					if (jsonRes.ok) {
						newResources = jsonRes.data.map((r: any) => ({
							name: r.name,
							id: r.id,
						}));
						setResources(newResources);
					}
				}

				// 2. Fetch events
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
				const start = startDate.toString("yyyy-MM-dd");
				const end = startDate.addDays(days).toString("yyyy-MM-dd");

				const resEvents = await fetch(
					`/api/schedule/events?start=${start}&end=${end}&type=${resourceType}`,
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
	}, [startDate, view, refreshKey, resourceType]);

	// Dynamic props for Scheduler
	const getSchedulerProps = () => {
		let days = 30;
		let scale: "Day" | "Hour" | "Week" | "Month" | "Year" | "Manual" =
			"Day";
		let timeHeaders: any[] = [
			{ groupBy: "Month" },
			{ groupBy: "Day", format: "d" },
		];
		let cellWidth = 50;
		// Logic duplicated for props? better to use state `config` but let's derive related props

		switch (view) {
			case "Day":
				days = 1;
				scale = "Hour";
				timeHeaders = [
					{ groupBy: "Day", format: "dddd, d MMMM yyyy" },
					{ groupBy: "Hour" },
				];
				cellWidth = 60;
				break;
			case "Week":
				days = 7;
				scale = "Day";
				// Using Month/Day/DayOfWeek for context
				timeHeaders = [
					{ groupBy: "Month" },
					{ groupBy: "Day", format: "ddd d" },
				];
				cellWidth = 100;
				break;
			case "Month":
				days = startDate.daysInMonth();
				scale = "Day";
				timeHeaders = [
					{ groupBy: "Month" },
					{ groupBy: "Day", format: "d" },
				];
				cellWidth = 60;
				break;
			case "Year":
				days = startDate.daysInYear();
				scale = "Day";
				timeHeaders = [
					{ groupBy: "Month" },
					{ groupBy: "Day", format: "d" },
				];
				cellWidth = 50;
				break;
		}
		return { days, scale, timeHeaders, cellWidth };
	};

	const schedulerProps = getSchedulerProps();

	return (
		<div className="flex flex-col h-full gap-4">
			<ScheduleNavigation
				view={view}
				handleViewChange={handleViewChange}
				handleNavigate={handleNavigate}
				startDate={startDate}
				resourceType={resourceType}
				setResourceType={setResourceType}
			/>

			<div className="flex-1 border overflow-hidden relative min-h-[400px]">
				{isLoading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
						<Loader2 className="h-10 w-10 animate-spin text-primary" />
					</div>
				)}
				<DayPilotScheduler
					controlRef={setScheduler}
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
					durationBarVisible={false}
				/>
			</div>

			<ActivityDetailsModal
				isVisible={isModalVisible}
				onClose={() => setIsModalVisible(false)}
				activity={selectedActivity}
				onEdit={() => {}}
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
			/>
		</div>
	);
};

export default Scheduler;
