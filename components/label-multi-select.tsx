"use client";

import { useEffect, useState, useMemo, type MouseEvent } from "react";
import { Check, ChevronsUpDown, Search, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface LabelMultiSelectProps {
	selectedSlugs: string[];
	onChange: (slugs: string[]) => void;
	placeholder?: string;
	existingLabels?: LabelOption[]; // Pre-loaded labels if available
	onLabelCreate?: (newLabel: LabelOption) => void;
}

interface LabelOption {
	id?: string;
	slug: string;
	name: string;
	color: string;
}

const DEFAULT_LABELS: LabelOption[] = [];

export function LabelMultiSelect({
	selectedSlugs = [],
	onChange,
	placeholder,
	existingLabels = DEFAULT_LABELS,
	onLabelCreate,
}: LabelMultiSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [options, setOptions] = useState<LabelOption[]>(existingLabels);
	const [loading, setLoading] = useState(false);

	// For creating new label
	const [isCreating, setIsCreating] = useState(false);
	const [newLabelName, setNewLabelName] = useState("");
	const [newLabelColor, setNewLabelColor] = useState("#3b82f6"); // Default blue

	const selectedValues = useMemo(() => {
		return selectedSlugs;
	}, [selectedSlugs]);

	useEffect(() => {
		if (existingLabels.length > 0) {
			setOptions(existingLabels);
			return;
		}

		const fetchOptions = async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/labels");
				if (!res.ok) throw new Error("Failed to fetch labels");
				const json = await res.json();

				if (json.ok && Array.isArray(json.data)) {
					setOptions(json.data);
				} else {
					setOptions([]);
				}
			} catch (error) {
				console.error("Error fetching labels:", error);
				setOptions([]);
			} finally {
				setLoading(false);
			}
		};

		fetchOptions();
	}, [existingLabels]);
	// Intentionally removed 'search' dependency to load all once, client filter or simple API structure
	// If API supports search, we can re-add it.

	// Filter options based on search locally for now as it's typically a small list
	const filteredOptions = useMemo(() => {
		if (!search) return options;
		return options.filter(
			(o) =>
				o.name.toLowerCase().includes(search.toLowerCase()) ||
				o.slug.toLowerCase().includes(search.toLowerCase()),
		);
	}, [options, search]);

	const handleSelect = (optionSlug: string) => {
		const isSelected = selectedValues.includes(optionSlug);
		if (isSelected) {
			onChange(selectedSlugs.filter((slug) => slug !== optionSlug));
		} else {
			onChange([...selectedSlugs, optionSlug]);
		}
	};

	const handleRemove = (slugToRemove: string, e: MouseEvent) => {
		e.stopPropagation();
		onChange(selectedSlugs.filter((slug) => slug !== slugToRemove));
	};

	const handleCreateLabel = () => {
		if (!search.trim()) return;

		// Simple slugify: lowercase, replace spaces with dashes
		const slug = search.trim().toLowerCase().replace(/\s+/g, "-");

		// Check if exists
		const exists = options.find((o) => o.slug === slug);
		if (exists) {
			handleSelect(slug);
			setSearch("");
			return;
		}

		// Add to local options immediately
		const newLabel: LabelOption = {
			slug: slug,
			name: search.trim(),
			color: newLabelColor,
		};

		setOptions([...options, newLabel]);
		onChange([...selectedSlugs, slug]);

		// Notify parent
		onLabelCreate?.(newLabel);

		setSearch("");
		setIsCreating(false);
		setNewLabelColor("#3b82f6");
	};

	// Color palette for picking
	const colors = [
		"#ef4444",
		"#f97316",
		"#f59e0b",
		"#eab308",
		"#84cc16",
		"#22c55e",
		"#10b981",
		"#14b8a6",
		"#06b6d4",
		"#0ea5e9",
		"#3b82f6",
		"#6366f1",
		"#8b5cf6",
		"#a855f7",
		"#d946ef",
		"#ec4899",
		"#f43f5e",
		"#64748b",
	];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between min-h-10 h-auto"
				>
					<div className="flex flex-wrap gap-1 items-center bg-transparent">
						{selectedValues.length === 0 && (
							<span className="text-muted-foreground font-normal">
								{placeholder || "Select labels..."}
							</span>
						)}
						{selectedValues.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{selectedValues.map((val) => {
									const opt = options.find(
										(o) => o.slug === val,
									);
									// Make new object for manually added ones if missing
									const displayLabel = opt || {
										name: val,
										color: "#ccc",
										slug: val,
									};

									return (
										<Badge
											key={val}
											className="mr-1 text-primary-foreground hover:bg-opacity-90 transition-colors"
											style={{
												backgroundColor:
													displayLabel.color,
												color: "#fff", // Assuming dark text on light bg or vice versa, simplified white for now
											}}
										>
											{displayLabel.name}
											<span
												className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
												onClick={(e) =>
													handleRemove(val, e)
												}
											>
												<X className="h-3 w-3 text-white hover:text-white/80" />
											</span>
										</Badge>
									);
								})}
							</div>
						)}
					</div>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[400px] p-0"
				align="start"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<div
					className="flex items-center border-b px-3 py-2"
					onPointerDown={(e) => e.stopPropagation()}
				>
					<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
					<Input
						placeholder="Search or create label..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								if (filteredOptions.length === 0 && search) {
									setIsCreating(true);
								}
							}
						}}
						className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-none shadow-none focus-visible:ring-0"
					/>
				</div>

				{isCreating && (
					<div
						className="p-3 border-b bg-slate-50"
						onPointerDown={(e) => e.stopPropagation()}
					>
						<div className="text-sm font-medium mb-2">
							Create "{search}"
						</div>
						<div className="flex flex-wrap gap-2 mb-3">
							{colors.map((c) => (
								<button
									key={c}
									type="button"
									className={cn(
										"w-5 h-5 rounded-full border border-gray-200 transition-all hover:scale-110",
										newLabelColor === c
											? "ring-2 ring-offset-1 ring-black scale-110"
											: "",
									)}
									style={{ backgroundColor: c }}
									onClick={() => setNewLabelColor(c)}
								/>
							))}
						</div>
						<div className="flex justify-end gap-2">
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setIsCreating(false)}
							>
								Cancel
							</Button>
							<Button size="sm" onClick={handleCreateLabel}>
								Add Label
							</Button>
						</div>
					</div>
				)}

				<div
					onPointerDown={(e) => e.stopPropagation()}
					onWheel={(e) => e.stopPropagation()}
					onTouchMove={(e) => e.stopPropagation()}
				>
					<ScrollArea className="h-[200px] p-1">
						{loading && options.length === 0 ? (
							<div className="space-y-2 p-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						) : filteredOptions.length === 0 && !isCreating ? (
							<div className="p-4 flex flex-col items-center justify-center text-center">
								<p className="text-sm text-muted-foreground mb-2">
									No labels found.
								</p>
								{search && (
									<Button
										variant="secondary"
										size="sm"
										onClick={() => setIsCreating(true)}
									>
										<Plus className="mr-2 h-4 w-4" />
										Create "{search}"
									</Button>
								)}
							</div>
						) : (
							<div className="grid gap-1">
								{filteredOptions.map((option) => (
									<div
										key={option.slug}
										className={cn(
											"flex items-center gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
											selectedValues.includes(option.slug)
												? "bg-accent/50"
												: "",
										)}
										onClick={() =>
											handleSelect(option.slug)
										}
									>
										<div
											className={cn(
												"flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												selectedValues.includes(
													option.slug,
												)
													? "bg-primary text-primary-foreground" // Primary check box
													: "opacity-50 [&_svg]:invisible",
											)}
										>
											<Check className={cn("h-4 w-4")} />
										</div>
										<div className="flex items-center gap-2">
											<div
												className="w-3 h-3 rounded-full"
												style={{
													backgroundColor:
														option.color,
												}}
											/>
											<span className="font-medium">
												{option.name}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</ScrollArea>
				</div>
			</PopoverContent>
		</Popover>
	);
}
