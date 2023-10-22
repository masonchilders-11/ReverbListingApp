import prisma from "~/db.server";

export async function getShopName() {
    try {
        const session = await prisma.session.findFirst({
            select: {
                shop: true
            }
        });

        return session?.shop;
    } catch (error) {
        console.error("Error fetching shop name:", error);
    }
}
