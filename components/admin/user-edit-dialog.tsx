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

interface UserEditHelper {
	id: string;
	name: string;
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
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (user) {
			setEditName(user.name);
		}
	}, [user]);

	const handleSaveEdit = async () => {
		if (!user) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/admin/users/${user.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: editName }),
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
				<div className="py-2">
					<Label>Name</Label>
					<Input
						value={editName}
						onChange={(e) => setEditName(e.target.value)}
					/>
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
