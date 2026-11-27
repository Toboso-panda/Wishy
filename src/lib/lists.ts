import { prisma } from "@/lib/db";

// Events where I have my own display of gifts
export async function myDisplayEvents(userId: string) {
  const events = await prisma.event.findMany({
    where: { members: { some: { userId } } }, orderBy: [{ date: "asc" }, { createdAt: "desc" }],
    select: { id: true, name: true, listMode: true, primaryListOwnerId: true },
  });
  return events.filter((event) => event.listMode === "EVERY_MEMBER_LIST" || event.primaryListOwnerId === userId);
}
