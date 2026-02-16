export async function resolveUser(
	value: string,
	context: any
): Promise<string[]> {
	if (value === "SUBMITTER") {
		return [context.submitterId];
	}

	// Check if value is a JSON array string
	if (value.startsWith("[") && value.endsWith("]")) {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) {
				return parsed;
			}
		} catch (e) {
			// ignore invalid json, treat as simple string
		}
	}

	// value = userId
	return [value];
}
