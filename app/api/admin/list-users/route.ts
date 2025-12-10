import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const query: Record<string, string> = {};

	// Map query params to admin.listUsers options
	for (const [key, value] of searchParams.entries()) {
		query[key] = value;
	}

	try {
		const result = await auth.api.listUsers({
			headers: await headers(),
			query,
		});

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json({ error }, { status: 500 });
	}
}
