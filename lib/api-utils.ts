import { NextResponse } from "next/server";

export function handleApiError(error: any) {
	console.error(error);
	if (error.message === "Unauthorized") {
		return NextResponse.json(
			{ ok: false, error: "Unauthorized" },
			{ status: 401 },
		);
	}
	if (error.message === "Forbidden") {
		return NextResponse.json(
			{ ok: false, error: "Forbidden" },
			{ status: 403 },
		);
	}
	if (error instanceof Error) {
		return NextResponse.json(
			{ ok: false, error: error.message },
			{ status: 400 },
		);
	}
	return NextResponse.json(
		{ ok: false, error: "Internal Server Error" },
		{ status: 500 },
	);
}
