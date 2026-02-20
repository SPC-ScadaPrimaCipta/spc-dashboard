import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DayPilot } from "@daypilot/daypilot-lite-react";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatIDR(amount: number | string) {
	const numericAmount =
		typeof amount === "string" ? parseFloat(amount) : amount;
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(numericAmount);
}

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

