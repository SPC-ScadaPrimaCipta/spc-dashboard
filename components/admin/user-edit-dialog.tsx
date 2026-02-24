"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface UserEditHelper {
	id: string;
	name: string;
	profile?: {
		divisionId?: string | null;
		position?: string | null;
		initials?: string | null;
	} | null;
}

interface UserEditDialogProps {
	user: UserEditHelper | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function UserEditDialog({
	user,
	open,
	onOpenChange,
	onSuccess,
}: UserEditDialogProps) {
	const [editName, setEditName] = useState("");
	const [editInitials, setEditInitials] = useState("");
	const [editDivisionId, setEditDivisionId] = useState<string>("none");
	const [editPosition, setEditPosition] = useState("");
	const [saving, setSaving] = useState(false);
	const [divisions, setDivisions] = useState<{ id: string; name: string }[]>(
		[],
	);
	const [fetchingDivisions, setFetchingDivisions] = useState(false);

	useEffect(() => {
		if (open && divisions.length === 0 && !fetchingDivisions) {
			setFetchingDivisions(true);
			fetch("/api/divisions")
				.then((res) => res.json())
				.then((data) => setDivisions(data))
				.catch((err) => console.error("Error fetching divisions", err))
				.finally(() => setFetchingDivisions(false));
		}
	}, [open, divisions.length, fetchingDivisions]);

	useEffect(() => {
		if (user) {
			setEditName(user.name);
			setEditInitials(user.profile?.initials || "");
			setEditDivisionId(user.profile?.divisionId || "none");
			setEditPosition(user.profile?.position || "");
		}
	}, [user]);

	const handleSaveEdit = async () => {
		if (!user) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/admin/users/${user.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: editName,
					initials: editInitials,
					divisionId:
						editDivisionId === "none" ? null : editDivisionId,
					position: editPosition,
				}),
			});

			if (res.ok) {
				toast.success("User updated");
				onOpenChange(false);
				if (onSuccess) onSuccess();
			} else {
				toast.error("Update failed");
			}
		} catch (err) {
			toast.error("Error updating user");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit User</DialogTitle>
					<DialogDescription>
						Change user display name
					</DialogDescription>
				</DialogHeader>
				<div className="py-2 space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Name</Label>
							<Input
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Initials</Label>
							<Input
								value={editInitials}
								onChange={(e) =>
									setEditInitials(e.target.value)
								}
								placeholder="e.g. JD"
								maxLength={10}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Division</Label>
						<Select
							value={editDivisionId}
							onValueChange={setEditDivisionId}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a division" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
								{divisions.map((d) => (
									<SelectItem key={d.id} value={d.id}>
										{d.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Position</Label>
						<Input
							value={editPosition}
							onChange={(e) => setEditPosition(e.target.value)}
							placeholder="e.g. Manager"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button onClick={handleSaveEdit} disabled={saving}>
						{saving ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
