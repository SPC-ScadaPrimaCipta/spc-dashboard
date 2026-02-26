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
	const processDate = type === "end" ? newDate.addDays(-1) : newDate;

	if (view !== "Day") {
		const dateStr = processDate.toString("yyyy-MM-dd");
		const timeStr = oldDate.toString("HH:mm:ss");
		const newDateDP = new DayPilot.Date(`${dateStr}T${timeStr}`);
		return formatDayPilotDate(newDateDP);
	}
	return formatDayPilotDate(processDate);
}

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

	return `
		<div style="display: flex; flex-direction: column; padding: 4px ${useInitials ? "2px" : "8px"}; justify-content: center; height: 100%; align-items: ${useInitials ? "center" : "flex-start"}; overflow: hidden; box-sizing: border-box;">
			<div style="font-weight: 500; font-size: ${useInitials ? "15px" : "13px"}; line-height: 1.2; word-break: break-word; text-align: ${useInitials ? "center" : "left"}; width: 100%;">${displayName}</div>
			${tagsHtml}
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
