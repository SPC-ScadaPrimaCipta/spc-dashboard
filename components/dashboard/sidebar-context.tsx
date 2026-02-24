"use client";

import { createContext, useContext, useEffect, useState } from "react";

type SidebarContextType = {
	collapsed: boolean;
	toggle: () => void;
	setCollapsed: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [collapsed, setCollapsed] = useState(true);

	useEffect(() => {
		const checkScreenWidth = () => {
			if (window.innerWidth <= 768) {
				// treat ≤768px as mobile
				setCollapsed(true); // or true, depending on your UX
			}
		};

		checkScreenWidth();
	}, []);

	return (
		<SidebarContext.Provider
			value={{
				collapsed,
				toggle: () => setCollapsed((c) => !c),
				setCollapsed,
			}}
		>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const ctx = useContext(SidebarContext);
	if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
	return ctx;
}
