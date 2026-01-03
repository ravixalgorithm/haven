
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "11aravipratapsingh@gmail.com";
    console.log(`Setting admin role for ${email}...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: "ADMIN" },
        });
        console.log(`Successfully made ${user.username} (ID: ${user.id}) an ADMIN.`);
    } catch (e) {
        console.error(`Failed to find user with email ${email}. Make sure they have signed up.`);
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
