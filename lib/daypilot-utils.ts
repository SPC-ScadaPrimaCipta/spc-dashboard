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
