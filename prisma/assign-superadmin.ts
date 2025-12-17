import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
	const userId = process.argv[2];

	if (!userId) {
		console.log("Usage: npx tsx prisma/assign-superadmin.ts <user-id>");
		process.exit(1);
	}

	console.log(`Assigning superadmin role to user: ${userId}`);

	// 1. Check if user exists
	const existingUser = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!existingUser) {
		console.error(`User with ID ${userId} not found.`);
		process.exit(1);
	}

	// 2. Ensure 'superadmin' role exists
	let superAdminRole = await prisma.role.findUnique({
		where: { name: "superadmin" },
	});

	if (!superAdminRole) {
		console.log("Creating 'superadmin' role...");
		superAdminRole = await prisma.role.create({
			data: {
				name: "superadmin",
				description: "Super Administrator with full access",
			},
		});
	}

	// 3. Assign role to user
	// We update the user to connect to the role AND set the `role` column for better-auth compatibility
	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: {
			role: "superadmin", // Update the string field
			roles: {
				connect: {
					id: superAdminRole.id, // Connect the relation
				},
			},
		},
		include: {
			roles: true,
		},
	});

	console.log("Successfully assigned superadmin role!");
	console.log("User:", updatedUser.email);
	console.log("Roles:", updatedUser.roles.map((r) => r.name).join(", "));
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
