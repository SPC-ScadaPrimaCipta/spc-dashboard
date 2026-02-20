import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteResourceModalProps {
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
	resource: any;
	onSuccess: () => void;
	toast: any;
}

export function DeleteResourceModal({
	isOpen,
	setIsOpen,
	resource,
	onSuccess,
	toast,
}: DeleteResourceModalProps) {
	const onDeleteConfirm = async () => {
		if (!resource) return;
		try {
			const res = await fetch(`/api/schedule/resources/${resource.id}`, {
				method: "DELETE",
			});
			const json = await res.json();
			if (json.ok) {
				toast.success("Resource deleted successfully");
				setIsOpen(false);
				onSuccess();
			} else {
				toast.error(json.error || "Failed to delete resource");
			}
		} catch (error) {
			toast.error("An error occurred");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Resource</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete {resource?.name}? This
						action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsOpen(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={onDeleteConfirm}
					>
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
