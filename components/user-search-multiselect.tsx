"use client";

import { useEffect, useState, useMemo, type MouseEvent } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
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

interface UserSearchMultiSelectProps {
	selectedIds: string[];
	onChange: (ids: string[]) => void;
	placeholder?: string;
}

interface Option {
	value: string;
	label: string;
	description?: string;
}

export function UserSearchMultiSelect({
	selectedIds = [],
	onChange,
	placeholder,
}: UserSearchMultiSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [options, setOptions] = useState<Option[]>([]);
	const [loading, setLoading] = useState(false);

	const selectedValues = useMemo(() => {
		return selectedIds;
	}, [selectedIds]);

	useEffect(() => {
		const fetchOptions = async () => {
			setLoading(true);
			try {
				// Fetch employees from /api/users
				const params = new URLSearchParams();
				if (search) params.set("search", search);

				const res = await fetch(`/api/users?${params.toString()}`);
				if (!res.ok) throw new Error("Failed to fetch users");
				const json = await res.json();

				if (json.ok && Array.isArray(json.data)) {
					setOptions(
						json.data.map((u: any) => ({
							value: u.id,
							label: u.name,
							description: u.email || "-",
						})),
					);
				} else {
					setOptions([]);
				}
			} catch (error) {
				console.error("Error fetching options:", error);
				setOptions([]);
			} finally {
				setLoading(false);
			}
		};

		const debounce = setTimeout(fetchOptions, 300);
		return () => clearTimeout(debounce);
	}, [search]);

	const handleSelect = (optionValue: string) => {
		const isSelected = selectedValues.includes(optionValue);
		if (isSelected) {
			onChange(selectedIds.filter((id) => id !== optionValue));
		} else {
			onChange([...selectedIds, optionValue]);
		}
	};

	const handleRemove = (valToRemove: string, e: MouseEvent) => {
		e.stopPropagation();
		onChange(selectedIds.filter((id) => id !== valToRemove));
	};

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
								{placeholder || "Select users..."}
							</span>
						)}
						{selectedValues.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{selectedValues.slice(0, 3).map((val) => {
									// Try to find label in options, or fallback to val
									const opt = options.find(
										(o) => o.value === val,
									);
									// Fallback UI if not found in current options
									return (
										<Badge
											variant="secondary"
											key={val}
											className="mr-1"
										>
											{opt ? opt.label : "User"}
											<span
												className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
												onClick={(e) =>
													handleRemove(val, e)
												}
											>
												<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
											</span>
										</Badge>
									);
								})}
								{selectedValues.length > 3 && (
									<Badge variant="secondary">
										+{selectedValues.length - 3} more
									</Badge>
								)}
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
						placeholder="Search users..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-none shadow-none focus-visible:ring-0"
					/>
				</div>
				<div
					onPointerDown={(e) => {
						// Prevent drag from propagating which might block scrolling
						e.stopPropagation();
					}}
					onWheel={(e) => e.stopPropagation()}
					onTouchMove={(e) => e.stopPropagation()}
				>
					<ScrollArea className="h-[200px] p-1">
						{loading && options.length === 0 ? (
							<div className="space-y-2 p-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						) : options.length === 0 ? (
							<p className="p-4 text-sm text-muted-foreground text-center">
								No users found.
							</p>
						) : (
							<div className="grid gap-1">
								{options.map((option) => (
									<div
										key={option.value}
										className={cn(
											"flex items-start gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
											selectedValues.includes(
												option.value,
											)
												? "bg-accent/50"
												: "",
										)}
										onClick={() =>
											handleSelect(option.value)
										}
									>
										<div
											className={cn(
												"flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												selectedValues.includes(
													option.value,
												)
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible",
											)}
										>
											<Check className={cn("h-4 w-4")} />
										</div>
										<div className="flex flex-col">
											<span className="font-medium">
												{option.label}
											</span>
											{option.description && (
												<span className="text-xs text-muted-foreground">
													{option.description}
												</span>
											)}
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
