import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useRequirePermission(
	action: string | string[],
	resource: string
) {
	const { data: session, isPending, error } = authClient.useSession();
	const router = useRouter();
	const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

	// Memoize action array key to prevent effect loops
	const actionKey = Array.isArray(action) ? action.join(",") : action;

	useEffect(() => {
		if (isPending) return;

		if (!session) {
			router.push("/auth/login");
			return;
		}

		// Check permissions
		// 1. Superadmin check
		const roles = (session.user as any).roles || [];
		if (roles.includes("superadmin")) {
			setIsAuthorized(true);
			return;
		}

		// 2. Permission check
		const permissions = (session.user as any).permissions || [];

		let hasPermission = false;
		if (permissions.includes("manage:all")) {
			hasPermission = true;
		} else {
			const requiredActions = Array.isArray(action) ? action : [action];
			// Check if user has ANY of the required permissions
			hasPermission = requiredActions.some((act) =>
				permissions.includes(`${act}:${resource}`)
			);
		}

		if (!hasPermission) {
			router.push("/forbidden");
			setIsAuthorized(false);
		} else {
			setIsAuthorized(true);
		}
	}, [session, isPending, router, actionKey, resource]); // Use actionKey dependency

	return { isAuthorized, isLoading: isPending || isAuthorized === null };
}
