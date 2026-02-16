"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";

interface UserCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function UserCreateDialog({
	open,
	onOpenChange,
	onSuccess,
}: UserCreateDialogProps) {
	const [creating, setCreating] = useState(false);
	const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
	const [createForm, setCreateForm] = useState<{
		name: string;
		email: string;
		password: string;
		roles: string[];
	}>({
		name: "",
		email: "",
		password: "",
		roles: [],
	});

	// Fetch roles when dialog opens
	useEffect(() => {
		if (open) {
			fetch("/api/admin/roles")
				.then((res) => res.json())
				.then((data) => {
					setRoles(data);
				})
				.catch((err) => console.error("Failed to fetch roles", err));
		}
	}, [open]);

	const handleCreateUser = async () => {
		if (
			!createForm.email ||
			!createForm.password ||
			!createForm.name ||
			createForm.roles.length === 0
		) {
			toast.error(
				"Please fill in all fields and select at least one role"
			);
			return;
		}

		setCreating(true);
		try {
			// Determine primary role based on selection
			// Rule: If "superadmin" is selected, primary role is "admin", else "user"
			const primaryRole = createForm.roles.includes("superadmin")
				? "admin"
				: "user";

			// 1. Create user with determined primary role
			const { data, error } = await authClient.admin.createUser({
				email: createForm.email,
				password: createForm.password,
				name: createForm.name,
				role: primaryRole,
			});

			if (error) {
				toast.error(error.message || "Failed to create user");
				setCreating(false);
				return;
			}

			// 2. Assign the selected role(s) via our API
			if (data) {
				const response = await fetch(
					`/api/admin/users/${data.user.id}/roles`,
					{
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							roles: createForm.roles, // Send all selected roles
						}),
					}
				);

				if (!response.ok) {
					toast.error("User created but failed to assign roles");
				} else {
					toast.success("User created successfully");
					onOpenChange(false);
					setCreateForm({
						name: "",
						email: "",
						password: "",
						roles: [],
					});
					if (onSuccess) onSuccess();
				}
			}
		} catch (err: any) {
			toast.error(err.message || "Error creating user");
		} finally {
			setCreating(false);
		}
	};

	const toggleRole = (roleName: string, checked: boolean) => {
		setCreateForm((prev) => {
			if (checked) {
				return { ...prev, roles: [...prev.roles, roleName] };
			} else {
				return {
					...prev,
					roles: prev.roles.filter((r) => r !== roleName),
				};
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New User</DialogTitle>
					<DialogDescription>
						Add a new user to the system.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label>Name</Label>
						<Input
							placeholder="John Doe"
							value={createForm.name}
							onChange={(e) =>
								setCreateForm({
									...createForm,
									name: e.target.value,
								})
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>Email</Label>
						<Input
							type="email"
							placeholder="john@example.com"
							value={createForm.email}
							onChange={(e) =>
								setCreateForm({
									...createForm,
									email: e.target.value,
								})
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>Password</Label>
						<PasswordInput
							placeholder="Secure password"
							value={createForm.password}
							onChange={(e) =>
								setCreateForm({
									...createForm,
									password: e.target.value,
								})
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>Roles</Label>
						<div className="border rounded-md p-4 space-y-3 max-h-[200px] overflow-y-auto">
							{roles.length === 0 ? (
								<div className="text-sm text-muted-foreground">
									Loading roles...
								</div>
							) : (
								roles.map((role) => (
									<div
										key={role.id}
										className="flex items-center space-x-2"
									>
										<Checkbox
											id={`role-${role.id}`}
											checked={createForm.roles.includes(
												role.name
											)}
											onCheckedChange={(checked) =>
												toggleRole(
													role.name,
													checked as boolean
												)
											}
										/>
										<Label
											htmlFor={`role-${role.id}`}
											className="font-normal cursor-pointer"
										>
											{role.name}
										</Label>
									</div>
								))
							)}
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button onClick={handleCreateUser} disabled={creating}>
						{creating ? "Creating..." : "Create User"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
