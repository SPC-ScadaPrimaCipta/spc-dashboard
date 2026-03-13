"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { HolidayDialog } from "./holiday-dialog";
import { YearPicker } from "@/components/year-picker";

interface Holiday {
	id: string;
	name: string;
	startAt: string;
	endAt: string;
}

export default function HolidaysPage() {
	const [data, setData] = useState<Holiday[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

	const fetchData = async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/holidays?year=${selectedYear}`);
			if (!res.ok) throw new Error("Failed to fetch holidays");
			const json = await res.json();
			if (json.ok) {
				setData(json.data);
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to load holidays");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [selectedYear]);

	// Group by month
	const getLocalDate = (iso: string) => {
		const [y, m, d] = iso.split("T")[0].split("-").map(Number);
		return new Date(y, m - 1, d);
	};
	const groupedHolidays = useMemo(() => {
		const groups: Record<string, Holiday[]> = {};
		data.forEach((holiday) => {
			const month = format(getLocalDate(holiday.startAt), "MMMM");
			if (!groups[month]) groups[month] = [];
			groups[month].push(holiday);
		});
		return groups;
	}, [data]);

	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	return (
		<div className="space-y-6 flex flex-col h-[calc(100vh-(--spacing(16)))]">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Holidays
					</h1>
					<p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
						Manage company-wide holidays and observances.
					</p>
				</div>
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">Year:</span>
						<YearPicker
							currentYear={selectedYear}
							onYearChange={setSelectedYear}
						/>
					</div>
					<Button
						onClick={() => setIsDialogOpen(true)}
						className="shadow-sm"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add Holiday
					</Button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto pr-2 pb-6">
				{loading ? (
					<div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-slate-50/30 rounded-lg border border-dashed">
						<Loader2 className="h-8 w-8 animate-spin mb-2" />
						<span>Fetching holidays...</span>
					</div>
				) : data.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-slate-50/30 rounded-lg border border-dashed">
						<CalendarIcon className="h-10 w-10 mb-4 opacity-50" />
						<p className="text-lg font-medium">No holidays found</p>
						<p className="text-sm">
							There are no holidays recorded for {selectedYear}.
						</p>
						<Button
							variant="outline"
							className="mt-4"
							onClick={() => setIsDialogOpen(true)}
						>
							Add your first holiday
						</Button>
					</div>
				) : (
					<div className="space-y-8 mt-2">
						{months.map((month) => {
							const holidaysInMonth = groupedHolidays[month];
							if (
								!holidaysInMonth ||
								holidaysInMonth.length === 0
							)
								return null;

							return (
								<div key={month} className="space-y-3">
									<h3 className="text-lg font-bold border-b pb-2 text-primary">
										{month}
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{holidaysInMonth.map((holiday) => (
											<Card
												key={holiday.id}
												className="hover:shadow-md transition-shadow cursor-default"
											>
												<CardContent className="p-4 flex flex-col justify-center">
													<div className="flex items-start justify-between">
														<div className="space-y-1">
															<h4 className="font-semibold text-base leading-tight">
																{holiday.name}
															</h4>
															<div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
																<CalendarIcon className="h-3.5 w-3.5" />
																<span>
																	{format(
																		getLocalDate(
																			holiday.startAt,
																		),
																		"MMM d",
																	)}
																	{holiday.startAt.split(
																		"T",
																	)[0] !==
																		holiday.endAt.split(
																			"T",
																		)[0] &&
																		` - ${format(
																			getLocalDate(
																				holiday.endAt,
																			),
																			"MMM d",
																		)}`}
																</span>
															</div>
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<HolidayDialog
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				onSuccess={fetchData}
			/>
		</div>
	);
}

