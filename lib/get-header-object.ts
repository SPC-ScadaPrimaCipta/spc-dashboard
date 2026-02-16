import { headers } from "next/headers";

export async function getHeaderObject() {
	const h = await headers();
	const obj: Record<string, string> = {};

	h.forEach((value, key) => {
		obj[key] = value;
	});

	return obj;
}
