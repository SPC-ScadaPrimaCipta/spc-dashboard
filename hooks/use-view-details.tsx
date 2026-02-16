"use client";

import { useRouter } from "next/navigation";

export const useViewDetails = () => {
	const router = useRouter();

	const handleViewDetails = (refType: string, refId: string) => {
		if (refType === "project_proposal") {
			router.push(`/proposals/${refId}`);
		}
	};

	return { handleViewDetails };
};
