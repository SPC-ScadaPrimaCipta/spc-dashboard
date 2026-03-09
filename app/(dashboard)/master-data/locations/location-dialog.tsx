"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { LocationRow } from "./columns";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface LocationDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	initialData?: LocationRow | null;
}

export function LocationDialog({
	isOpen,
	onOpenChange,
	onSuccess,
	initialData,
}: LocationDialogProps) {
	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [description, setDescription] = useState("");
	const [address, setAddress] = useState("");
	const [category, setCategory] = useState<"OFFICE" | "NON_OFFICE">("OFFICE");
	const [isActive, setIsActive] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const isEdit = !!initialData;

	useEffect(() => {
		if (isOpen) {
			if (initialData) {
				setName(initialData.name || "");
				setCode(initialData.code || "");
				setDescription(initialData.description || "");
				setAddress(initialData.address || "");
				setCategory(initialData.category || "OFFICE");
				setIsActive(initialData.isActive ?? true);
			} else {
				setName("");
				setCode("");
				setDescription("");
				setAddress("");
				setCategory("OFFICE");
				setIsActive(true);
			}
		}
	}, [isOpen, initialData]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name) return toast.error("Name is required");
		if (!code) return toast.error("Code is required");

		setIsLoading(true);
		try {
			const url = isEdit
				? `/api/locations/${initialData.id}`
				: "/api/locations";

			const method = isEdit ? "PATCH" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					code,
					description,
					address,
					category,
					isActive,
				}),
			});

			if (res.ok) {
				toast.success(isEdit ? "Location updated" : "Location added");
				onSuccess();
				handleClose();
			} else {
				const err = await res.json();
				throw new Error(err.error || "Failed to save location");
			}
		} catch (error: any) {
			console.error(error);
			toast.error(error.message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		onOpenChange(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="p-0 overflow-hidden gap-0 sm:max-w-[425px]">
				<DialogHeader className="p-6 pb-2">
					<DialogTitle>
						{isEdit ? "Edit Location" : "Add New Location"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update the details for this location."
							: "Define a new location entry."}
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={handleSubmit}
					className="space-y-4 px-6 pb-6 pt-2"
				>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="loc-name">Name</Label>
							<Input
								id="loc-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Jakarta Office"
								disabled={isLoading}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="loc-code">Code</Label>
							<Input
								id="loc-code"
								value={code}
								onChange={(e) => setCode(e.target.value)}
								placeholder="e.g. JKT-01"
								disabled={isLoading}
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Category</Label>
						<Select
							value={category}
							onValueChange={(val: "OFFICE" | "NON_OFFICE") =>
								setCategory(val)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="OFFICE">Office</SelectItem>
								<SelectItem value="NON_OFFICE">
									Non-Office
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="loc-address">Address</Label>
						<Textarea
							id="loc-address"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							placeholder="Full address of the location"
							disabled={isLoading}
							rows={2}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="loc-description">Description</Label>
						<Textarea
							id="loc-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Optional details..."
							disabled={isLoading}
							rows={2}
						/>
					</div>

					{isEdit && (
						<div className="flex items-center justify-between mt-4 p-3 bg-muted/50 rounded-md border text-sm">
							<div className="space-y-0.5">
								<Label>Active Status</Label>
								<div className="text-muted-foreground text-xs">
									Determine if this location is selectable.
								</div>
							</div>
							<Switch
								checked={isActive}
								onCheckedChange={setIsActive}
								disabled={isLoading}
							/>
						</div>
					)}

					<DialogFooter className="pt-4 mb-3">
						<Button
							type="button"
							variant="ghost"
							onClick={handleClose}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{isEdit ? "Update Changes" : "Save Location"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
