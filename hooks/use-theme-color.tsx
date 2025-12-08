"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { colorThemes } from "@/components/color-themes";

// const colorThemes = [
// 	{
// 		name: "Violet",
// 		color: "oklch(0.541 0.281 293.009)",
// 		dark: "oklch(0.606 0.25 292.717)",
// 	},
// 	{
// 		name: "Blue",
// 		color: "oklch(0.6 0.118 184.704)",
// 		dark: "oklch(0.6 0.118 184.704)",
// 	},
// 	{
// 		name: "Green",
// 		color: "oklch(0.696 0.17 162.48)",
// 		dark: "oklch(0.696 0.17 162.48)",
// 	},
// 	{
// 		name: "Orange",
// 		color: "oklch(0.769 0.188 70.08)",
// 		dark: "oklch(0.769 0.188 70.08)",
// 	},
// 	{
// 		name: "Pink",
// 		color: "oklch(0.627 0.265 303.9)",
// 		dark: "oklch(0.627 0.265 303.9)",
// 	},
// 	{
// 		name: "Red",
// 		color: "oklch(0.645 0.246 16.439)",
// 		dark: "oklch(0.645 0.246 16.439)",
// 	},
// 	{ name: "Neutral", color: "oklch(0.205 0 0)", dark: "oklch(0.922 0 0)" },
// ];

export function useThemeColor() {
	const [colorTheme, setColorTheme] = useState<
		(typeof colorThemes)[0] | null
	>(null);
	const { theme: currentTheme } = useTheme();

	// const applyColor = (color: string) => {
	// 	const root = document.documentElement;
	// 	root.style.setProperty("--primary", color);
	// 	root.style.setProperty("--ring", color);
	// 	root.style.setProperty("--sidebar-primary", color);
	// 	root.style.setProperty("--sidebar-ring", color);
	// };
	const applyColor = (color: Record<string, string>) => {
		const root = document.documentElement;

		for (const key in color) {
			root.style.setProperty(key, color[key]);
		}
	};

	const setColor = (theme: (typeof colorThemes)[0]) => {
		console.log("Setting theme color to:", theme);
		if (currentTheme === "dark") {
			applyColor(theme.dark);
			setColorTheme(theme);
		} else {
			applyColor(theme.light);
			setColorTheme(theme);
		}
		localStorage.setItem("theme-color", theme.name);
	};

	useEffect(() => {
		const savedColor = localStorage.getItem("theme-color");
		let theme = colorThemes[0];
		let color = currentTheme === "dark" ? theme.dark : theme.light;

		if (savedColor) {
			const found = colorThemes.find((t) => t.name === savedColor);
			if (found) {
				theme = found;
				color = currentTheme === "dark" ? found.dark : found.light;
			}
		}

		applyColor(color);

		// Only update state if needed, and do it after DOM update
		setTimeout(() => {
			setColorTheme(theme);
		}, 0);
	}, [currentTheme]);

	return {
		colorTheme: colorTheme || colorThemes[0], // Always return a valid theme
		setColor,
		colorThemes,
		isDark: currentTheme === "dark",
	};
}
