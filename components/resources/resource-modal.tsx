import { useState } from "react";
import { ScheduleResource, ResourceType } from "@/components/resources/types";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserSearchMultiSelect } from "@/components/user-search-multiselect";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	resourceTypeId: z.string().min(1, "Type is required"),
	userId: z.string().optional(),
});

interface ResourceModalProps {
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
	resource: ScheduleResource | null;
	resourceType: ResourceType;
	onSuccess: () => void;
	toast: any;
}

export function ResourceModal({
	isOpen,
	setIsOpen,
	resource,
	resourceType,
	onSuccess,
	toast,
}: ResourceModalProps) {
	const isEdit = !!resource;

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: resource?.name || "",
			resourceTypeId: resourceType?.id || "",
			userId: resource?.userId || "",
		},
	});

	// Reset form when modal opens or resource changes
	useState(() => {
		if (isOpen) {
			form.reset({
				name: resource?.name || "",
				resourceTypeId: resourceType?.id || "",
				userId: resource?.userId || "",
			});
		}
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			const url = isEdit
				? `/api/schedule/resources/${resource.id}`
				: "/api/schedule/resources";
			const method = isEdit ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: values.name,
					resourceTypeId: resourceType.id, // Always enforce the passed type id
					userId: values.userId || null,
				}),
			});
			const json = await res.json();
			if (json.ok) {
				toast.success(
					`Resource ${isEdit ? "updated" : "created"} successfully`,
				);
				setIsOpen(false);
				form.reset();
				onSuccess();
			} else {
				toast.error(
					json.error ||
						`Failed to ${isEdit ? "update" : "create"} resource`,
				);
			}
		} catch (error) {
			toast.error("An error occurred");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit" : "Add"}{" "}
						{resourceType?.name || "Resource"}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update the details of this resource."
							: "Create a new resource."}
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-4"
				>
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							{...form.register("name")}
							placeholder="Enter resource name"
						/>
						{form.formState.errors.name && (
							<p className="text-sm text-destructive">
								{form.formState.errors.name.message}
							</p>
						)}
					</div>

					{(resourceType?.code === "PERSON" ||
						resourceType?.code === "PEOPLE") && (
						<div className="space-y-2">
							<Label>Linked Employee</Label>
							<Controller
								control={form.control}
								name="userId"
								render={({ field }) => (
									<UserSearchMultiSelect
										selectedIds={
											field.value ? [field.value] : []
										}
										onChange={(val) =>
											field.onChange(val[0] || "")
										}
										placeholder="Select an employee..."
										single
									/>
								)}
							/>
						</div>
					)}

					{/* Hidden input for resourceTypeId to keep it in form state seamlessly */}
					<input
						type="hidden"
						{...form.register("resourceTypeId")}
						value={resourceType?.id || ""}
					/>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={form.formState.isSubmitting}
						>
							{isEdit ? "Update" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
