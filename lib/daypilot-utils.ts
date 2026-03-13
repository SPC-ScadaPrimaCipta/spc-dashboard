import { DayPilot } from "@daypilot/daypilot-lite-react";

export function formatDayPilotDate(d: DayPilot.Date): string {
	return d.toString("yyyy-MM-ddTHH:mm:ss") + ".000Z";
}

export function calculateDayPilotNewDate(
	view: string,
	newDate: DayPilot.Date,
	oldDate: DayPilot.Date,
	type: "start" | "end",
): string {
	if (view === "Day") {
		return formatDayPilotDate(newDate);
	}

	const processDate = type === "end" ? newDate.addMinutes(-1) : newDate;

	console.log("process date", processDate);

	const dateStr = processDate.toString("yyyy-MM-dd");
	const timeStr = processDate.toString("HH:mm:ss");
	const newDateDP = new DayPilot.Date(`${dateStr}T${timeStr}`);
	return formatDayPilotDate(newDateDP);
}

export const renderTaskRowHeader = (row: any) => {
	const taskName = row.name;
	const color = row.data?.tags?.color || "#3d85c6";

	return `
		<div style="display: flex; align-items: center; padding: 0 2px; height: 100%; overflow: hidden; box-sizing: border-box;">
			<div style="width: 4px; height: 32px; border-radius: 999px; background-color: ${color}; flex-shrink: 0;"></div>
			<div style="margin-left: 5px; display: flex; flex-direction: column; justify-content: center; overflow: hidden;">
				<div style="font-weight: 600; font-size: 13px; line-height: 1.3; color: #374151; word-break: break-word;">${taskName}</div>
			</div>
		</div>
	`;
};

export const renderPeopleRowHeader = (row: any, useInitials: boolean) => {
	let displayName = row.name;
	if (useInitials) {
		const profileInitials = row.data.tags?.initials;
		if (profileInitials) {
			displayName = profileInitials;
		} else {
			displayName = row.name
				.split(" ")
				.filter(Boolean)
				.map((n: string) => n.charAt(0))
				.join("")
				.toUpperCase()
				.substring(0, 3);
		}
	}

	let tagsHtml = "";
	const tagData = row.data.tags;
	if (tagData) {
		let displayText = "";
		let bgColor = "#f3f4f6";
		let fontColor = "#4b5563";
		let borderColor = "#e5e7eb";

		if (tagData.divisionCode || tagData.division) {
			displayText = tagData.divisionCode || tagData.division;
			if (tagData.divisionColor) {
				bgColor = tagData.divisionColor;
				fontColor = "#ffffff";
				borderColor = tagData.divisionColor;
			}
		} else if (tagData.position) {
			displayText = tagData.position;
		}

		if (displayText) {
			const maxLen = useInitials ? 5 : 8;
			const truncated =
				displayText.length > maxLen
					? displayText.substring(0, maxLen) + "..."
					: displayText;

			tagsHtml =
				'<div style="margin-top: 4px; width: 100%; display: flex; justify-content: ' +
				(useInitials ? "center" : "flex-start") +
				';"><span style="background-color: ' +
				bgColor +
				"; color: " +
				fontColor +
				"; font-size: " +
				(useInitials ? "9px" : "10px") +
				"; padding: 2px 4px; border-radius: 4px; border: 1px solid " +
				borderColor +
				'; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;" title="' +
				displayText +
				'">' +
				truncated +
				"</span></div>";
		}
	}

	// ${tagsHtml} removed department tags
	return `
		<div style="display: flex; flex-direction: column; padding: 4px ${useInitials ? "2px" : "8px"}; justify-content: center; height: 100%; align-items: ${useInitials ? "center" : "flex-start"}; overflow: hidden; box-sizing: border-box;">
			<div style="font-weight: 500; font-size: ${useInitials ? "15px" : "13px"}; line-height: 1.2; word-break: break-word; text-align: ${useInitials ? "center" : "left"}; width: 100%;">${displayName}</div>
		</div>
	`;
};

export const getSchedulerProps = (
	view: "Day" | "Week" | "Month" | "Year",
	startDate: DayPilot.Date,
) => {
	let days = 30;
	let scale: "Day" | "Hour" | "Week" | "Month" | "Year" | "Manual" = "Day";
	let timeHeaders: any[] = [
		{ groupBy: "Month" },
		{ groupBy: "Day", format: "d" },
	];
	let cellWidth = 50;

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
			cellWidth = 52;
			break;
		case "Year":
			days = startDate.daysInYear();
			scale = "Day";
			timeHeaders = [
				{ groupBy: "Month" },
				{ groupBy: "Day", format: "d" },
			];
			cellWidth = 35;
			break;
	}
	return { days, scale, timeHeaders, cellWidth };
};

export const handleBeforeEventRender = (
	args: DayPilot.SchedulerBeforeEventRenderArgs,
	resourceType: string,
	onCopy?: (data: {
		taskId: string;
		durationMin: number;
		text: string;
		allDay?: boolean;
		originalStartAt?: string;
	}) => void,
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

	const hasVehicle =
		resourceType !== "VEHICLE" &&
		args.data.tags?.resourceTypes?.includes("VEHICLE");
	const vehiclePattern = hasVehicle
		? `<div style="position: absolute; inset: 0; opacity: 0.2; pointer-events: none; background-image: radial-gradient(currentColor 2.5px, transparent 0); background-size: 8px 8px;"></div>`
		: "";

	const initials = args.data.tags?.initials;
	const initialsHtml = initials
		? `<div class="text-[9px] font-bold opacity-80 mt-0.5 uppercase flex items-center gap-1">
				<span class="bg-black/20 px-1 rounded-sm">${initials}</span>
		   </div>`
		: "";

	const displayText = resourceType === "TASK" ? initials : args.data.text;

	// Render the title and date directly into the HTML of the event box
	// We use a wrapper div without padding to ensure the pattern covers 100% of the area
	// <div class="text-[10px] opacity-90 truncate leading-tight mt-0.5">${timeStr}</div> removed date
	args.data.html = `
			<div class="h-full w-full relative overflow-hidden flex flex-col justify-center">
				${vehiclePattern}
				<div class="px-2 py-0.5 relative z-10 flex flex-col justify-center">
					<div class="font-semibold text-sm truncate leading-tight">${displayText}</div>
				</div>
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
				clickArgs.preventDefault();
				const e = clickArgs.source;
				const sDP = new DayPilot.Date(e.data.start as string);
				const eDP = new DayPilot.Date(e.data.end as string);
				const durationMs = eDP.getTime() - sDP.getTime();
				const durationMin = Math.round(durationMs / 60000);

				if (onCopy) {
					onCopy({
						taskId: e.data.taskId,
						durationMin,
						text: e.text(),
						allDay: e.data.tags?.allDay,
						originalStartAt: e.data.start as string,
					});
				}
			},
		},
	];
};

export const handleBeforeRowHeaderRender = (
	args: DayPilot.SchedulerBeforeRowHeaderRenderArgs,
	resourceType: string,
	useInitials: boolean,
) => {
	if (resourceType === "PEOPLE" || resourceType === "TIMEOFF") {
		args.row.html = renderPeopleRowHeader(args.row, useInitials);
	}

	if (resourceType === "TASK") {
		args.row.html = renderTaskRowHeader(args.row);
	}
};

export const handleBeforeTimeHeaderRender = (
	args: DayPilot.SchedulerBeforeTimeHeaderRenderArgs,
	view: string,
	holidays: any[],
) => {
	const now = new DayPilot.Date();
	
	let isHeaderHoliday = false;
	const headerStart = args.header.start.getTime();
	const headerEnd = args.header.end?.getTime() ?? args.header.start.addDays(1).getTime();
	const isDayLengthOrLess = (headerEnd - headerStart) <= 24 * 60 * 60 * 1000;

	if (isDayLengthOrLess && holidays?.length) {
		isHeaderHoliday = holidays.some((holiday) => {
			const hStart = new DayPilot.Date(holiday.startAt).getTime();
			const hEnd = new DayPilot.Date(holiday.endAt || holiday.startAt).getTime();
			return hStart < headerEnd && hEnd > headerStart;
		});
	}

	const dayOfWeek = args.header.start.getDayOfWeek();
	const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

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

	if (isHeaderHoliday && !isWeekend && isDayLengthOrLess) {
		const content = (args.header as any).text || args.header.html || args.header.start.toString("d");
		args.header.html = `<span style="color: #ef4444; font-weight: bold;">${content}</span>`;
	}
};

export const handleBeforeCellRender = (
	args: DayPilot.SchedulerBeforeCellRenderArgs,
	view: string,
	resourceType: string,
	timeOffMap: Map<string, { start: number; end: number }[]>,
	holidays: any[],
) => {
	const now = new DayPilot.Date();

	// Default background for today
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

	// Check if this cell is inside a holiday
	const cellStart = args.cell.start.getTime();
	const cellEnd = args.cell.end.getTime();

	const isHoliday = holidays.some((holiday) => {
		const hStart = new DayPilot.Date(holiday.startAt).getTime();
		const hEnd = new DayPilot.Date(holiday.endAt || holiday.startAt).getTime();
		return hStart < cellEnd && hEnd > cellStart;
	});

	const dayOfWeek = args.cell.start.getDayOfWeek();
	const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

	if (isHoliday && !isWeekend) {
		args.cell.properties.backColor = "#fee2e2"; // Light red out like today but red
	}

	// Highlight time off for PEOPLE resource type
	if (resourceType === "PEOPLE") {
		const resourceId = String(args.cell.resource);
		const cellStart = args.cell.start.getTime();
		const cellEnd = args.cell.end.getTime();

		const resourceTimeOff = timeOffMap.get(resourceId);
		if (resourceTimeOff) {
			const isOnLeave = resourceTimeOff.some((to) => {
				return to.start < cellEnd && to.end > cellStart;
			});

			if (isOnLeave) {
				args.cell.properties.backColor = "#fee2e2"; // Light red (Tailwind red-100)
				args.cell.properties.html =
					'<div style="position: absolute; top: 2px; left: 2px; color: #ef4444; font-size: 10px; font-weight: 700;">OFF</div>';
			}
		}
	}
};
