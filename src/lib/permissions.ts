import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
}

export async function requireMembership(eventId: string) {
  const user = await requireUser();
  const membership = await prisma.eventMember.findUnique({ where: { eventId_userId: { eventId, userId: user.id } } });
  if (!membership) notFound();
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();
  return { user, membership, event };
}

export const isManager = (role: Role) => role === "OWNER" || role === "ADMIN";

export async function listAccess(eventId: string, listOwnerId: string) {
  const context = await requireMembership(eventId);
  const listOwner = await prisma.eventMember.findUnique({ where: { eventId_userId: { eventId, userId: listOwnerId } } });
  if (!listOwner) redirect(`/events/${eventId}?error=${encodeURIComponent("Aquesta persona no és membre de l’esdeveniment.")}`);
  const ownList = context.user.id === listOwnerId;
  if (context.event.listMode === "SINGLE_LIST" && context.event.primaryListOwnerId !== listOwnerId) {
    redirect(`/events/${eventId}?error=${encodeURIComponent("Aquesta persona no té la llista d’aquest esdeveniment.")}`);
  }
  const responsibility = ownList ? null : await prisma.profileResponsibility.findUnique({
    where: { eventId_profileUserId_responsibleUserId: { eventId, profileUserId: listOwnerId, responsibleUserId: context.user.id } },
  });
  const owner = context.membership.role === "OWNER";
  const responsibleForAll = context.membership.role === "ADMIN" && context.membership.managesAllLists;
  const canEditOwnList = ownList && (context.event.listMode === "EVERY_MEMBER_LIST" || context.event.primaryListOwnerId === context.user.id);
  const canViewList = owner || responsibleForAll || ownList || !responsibility || responsibility.canViewList;
  const canEditAll = owner || responsibleForAll || canEditOwnList || Boolean(responsibility?.canViewList);
  const canEditOwnHidden = Boolean(responsibility && !responsibility.canViewList && !ownList);
  return { ...context, responsibility, ownList, owner, responsibleForAll, canViewList, canEditAll, canEditOwnHidden, canCreate: canEditAll || Boolean(responsibility) };
}

export async function requireItemEditor(eventId: string, listOwnerId: string, itemId?: string) {
  const access = await listAccess(eventId, listOwnerId);
  if (!itemId) {
    if (!access.canCreate) redirect(`/events/${eventId}/members/${listOwnerId}?error=${encodeURIComponent("No tens permisos per afegir regals a aquesta llista.")}`);
    return { ...access, hideNewItemFromOwner: !access.ownList && Boolean(access.responsibility || access.responsibleForAll) };
  }
  const item = await prisma.item.findFirst({ where: { id: itemId, eventId, listOwnerId } });
  if (!item) notFound();
  const hiddenFromSelf = access.ownList && item.isHiddenFromListOwner;
  const canEdit = !hiddenFromSelf && (access.canEditAll || (access.canEditOwnHidden && item.createdBy === access.user.id && item.isHiddenFromListOwner));
  if (!canEdit) redirect(`/events/${eventId}/members/${listOwnerId}?error=${encodeURIComponent("No tens permisos per modificar aquest regal.")}`);
  return { ...access, hideNewItemFromOwner: false };
}

export async function canCreateManagedProfile(eventId: string, userId: string) {
  const membership = await prisma.eventMember.findUnique({ where: { eventId_userId: { eventId, userId } } });
  if (!membership) return false;
  if (membership.role === "OWNER" || membership.role === "ADMIN" || membership.managesAllLists) return true;
  return (await prisma.profileResponsibility.count({ where: { eventId, responsibleUserId: userId } })) > 0;
}
