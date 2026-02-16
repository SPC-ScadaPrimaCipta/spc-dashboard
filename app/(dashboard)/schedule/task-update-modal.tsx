"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ActivityUpdateModalProps {
	isVisible: boolean;
	onClose: () => void;
	activity: any;
	onUpdate: () => void;
}

export function ActivityUpdateModal({
	isVisible,
	onClose,
	activity,
	onUpdate,
}: ActivityUpdateModalProps) {
	return (
		<Dialog open={isVisible} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Update Activity</DialogTitle>
				</DialogHeader>
				<div className="p-4 text-center text-muted-foreground">
					Edit functionality coming soon...
				</div>
			</DialogContent>
		</Dialog>
	);
}
