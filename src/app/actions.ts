"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { ListMode, Prisma, ReservationMode, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { clearSession, createSession, currentUser } from "@/lib/session";
import { canCreateManagedProfile, isManager, listAccess, requireItemEditor, requireMembership, requireUser } from "@/lib/permissions";
import { hashPassword, verifyPassword } from "@/lib/password";
import { removeImage, saveImage } from "@/lib/uploads";

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const optional = (value: string) => value || null;
const fail = (path: string, message: string): never => redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
const eventPath = (id: string) => `/events/${id}`;
const listPath = (eventId: string, userId: string) => `${eventPath(eventId)}/members/${userId}`;

async function canModerateItemReservations(eventId: string, item: { listOwnerId: string; createdBy: string; isHiddenFromListOwner: boolean }, userId: string) {
  if (item.listOwnerId === userId) return false;
  const access = await listAccess(eventId, item.listOwnerId);
  return access.owner || access.canEditAll || (access.canEditOwnHidden && item.createdBy === userId && item.isHiddenFromListOwner);
}

export async function createAccount(data: FormData) {
  const name = text(data, "name");
  const email = text(data, "email").toLowerCase();
  const password = String(data.get("password") ?? "");
  const confirmation = String(data.get("confirmPassword") ?? "");
  const inviteToken = text(data, "inviteToken");
  const invite = inviteToken ? await prisma.event.findUnique({ where: { inviteToken } }) : null;
  const formPath = inviteToken ? `/join/${encodeURIComponent(inviteToken)}?mode=register` : "/?mode=register";
  if (inviteToken && !invite) fail(formPath, "L’enllaç d’invitació no és vàlid.");
  if (name.length < 1 || name.length > 60) fail(formPath, "El nom és obligatori (màxim 60 caràcters).");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fail(formPath, "Introdueix un correu vàlid.");
  if (password.length < 8 || password.length > 128) fail(formPath, "La contrasenya ha de tenir entre 8 i 128 caràcters.");
  if (password !== confirmation) fail(formPath, "Les contrasenyes no coincideixen.");
  const passwordHash = await hashPassword(password);
  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { name, email, passwordHash } });
      if (invite) await tx.eventMember.create({ data: { eventId: invite.id, userId: created.id } });
      return created;
    });
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") fail(formPath, "Ja existeix un compte amb aquest correu.");
    throw error;
  }
  await createSession(user.id);
  redirect(invite ? eventPath(invite.id) : "/");
}

export async function loginAccount(data: FormData) {
  const email = text(data, "email").toLowerCase();
  const password = String(data.get("password") ?? "");
  const inviteToken = text(data, "inviteToken");
  const invite = inviteToken ? await prisma.event.findUnique({ where: { inviteToken } }) : null;
  const formPath = inviteToken ? `/join/${encodeURIComponent(inviteToken)}?mode=login` : "/?mode=login";
  if (inviteToken && !invite) fail(formPath, "L’enllaç d’invitació no és vàlid.");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) redirect(`${formPath}&error=${encodeURIComponent("El correu o la contrasenya no són correctes.")}`);
  if (!(await verifyPassword(password, user.passwordHash))) fail(formPath, "El correu o la contrasenya no són correctes.");
  if (invite) await prisma.eventMember.upsert({ where: { eventId_userId: { eventId: invite.id, userId: user.id } }, create: { eventId: invite.id, userId: user.id }, update: {} });
  await createSession(user.id);
  redirect(invite ? eventPath(invite.id) : "/");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function createEvent(data: FormData) {
  const user = await requireUser();
  const name = text(data, "name");
  if (!name || name.length > 100) fail("/events/new", "El nom és obligatori (màxim 100 caràcters).");
  const description = text(data, "description");
  if (description.length > 500) fail("/events/new", "La descripció no pot superar els 500 caràcters.");
  const mode = text(data, "listMode");
  if (mode !== "EVERY_MEMBER_LIST" && mode !== "SINGLE_LIST") fail("/events/new", "Tria un mode de llista vàlid.");
  const dateValue = text(data, "date");
  const date = dateValue ? new Date(`${dateValue}T12:00:00`) : null;
  if (date && Number.isNaN(date.getTime())) fail("/events/new", "La data no és vàlida.");
  const event = await prisma.event.create({
    data: {
      name, description: optional(description), date, listMode: mode as ListMode,
      primaryListOwnerId: mode === "SINGLE_LIST" ? user.id : null, ownerId: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  redirect(eventPath(event.id));
}

export async function joinEvent(data: FormData) {
  const token = text(data, "token");
  const event = await prisma.event.findUnique({ where: { inviteToken: token } });
  if (!event) redirect(`/join/${encodeURIComponent(token)}?error=${encodeURIComponent("L’enllaç d’invitació no és vàlid.")}`);
  const user = await currentUser();
  if (!user) redirect(`/join/${encodeURIComponent(token)}`);
  await prisma.eventMember.upsert({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
    create: { eventId: event.id, userId: user.id }, update: {},
  });
  redirect(eventPath(event.id));
}

export async function updateEvent(data: FormData) {
  const eventId = text(data, "eventId");
  const { membership, event } = await requireMembership(eventId);
  if (membership.role !== "OWNER") fail(`${eventPath(eventId)}/settings`, "Només el propietari pot editar la configuració.");
  const name = text(data, "name");
  if (!name || name.length > 100) fail(`${eventPath(eventId)}/settings`, "El nom és obligatori (màxim 100 caràcters).");
  const description = text(data, "description");
  if (description.length > 500) fail(`${eventPath(eventId)}/settings`, "La descripció no pot superar els 500 caràcters.");
  const dateValue = text(data, "date");
  const date = dateValue ? new Date(`${dateValue}T12:00:00`) : null;
  if (date && Number.isNaN(date.getTime())) fail(`${eventPath(eventId)}/settings`, "La data no és vàlida.");
  const primaryListOwnerId = text(data, "primaryListOwnerId") || null;
  if (event.listMode === "SINGLE_LIST") {
    const exists = primaryListOwnerId && await prisma.eventMember.findUnique({ where: { eventId_userId: { eventId, userId: primaryListOwnerId } } });
    if (!exists) fail(`${eventPath(eventId)}/settings`, "Tria un membre d’aquest esdeveniment.");
  }
  await prisma.event.update({ where: { id: eventId }, data: {
    name, description: optional(description), date,
    ...(event.listMode === "SINGLE_LIST" ? { primaryListOwnerId } : {}),
  } });
  revalidatePath(eventPath(eventId));
  redirect(`${eventPath(eventId)}/settings?saved=1`);
}

// Only the owner can delete an event. Everything in it goes too: lists, gifts, photos and family profiles.
export async function deleteEvent(data: FormData) {
  const eventId = text(data, "eventId");
  const confirmation = text(data, "confirmName");
  const { membership, event } = await requireMembership(eventId);
  const settings = `${eventPath(eventId)}/settings`;
  if (membership.role !== "OWNER" || event.ownerId !== membership.userId) fail(settings, "Només el propietari pot eliminar l’esdeveniment.");
  if (confirmation !== event.name) fail(settings, "Escriu el nom de l’esdeveniment exactament per confirmar-ho.");
  const images = await prisma.$transaction(async (tx) => {
    const items = await tx.item.findMany({ where: { eventId }, select: { imagePath: true } });
    const profiles = await tx.eventMember.findMany({ where: { eventId, user: { isManagedProfile: true } }, select: { userId: true } });
    await tx.event.delete({ where: { id: eventId } });
    // Family profiles without an account only exist inside this event
    if (profiles.length) await tx.user.deleteMany({ where: { id: { in: profiles.map((p) => p.userId) }, isManagedProfile: true, memberships: { none: {} } } });
    return items.map((item) => item.imagePath);
  });
  await Promise.all(images.map(removeImage));
  revalidatePath("/");
  redirect("/?deleted=1");
}

export async function regenerateInvite(data: FormData) {
  const eventId = text(data, "eventId");
  const { membership } = await requireMembership(eventId);
  if (!isManager(membership.role)) fail(`${eventPath(eventId)}/settings`, "No tens permisos per fer aquesta acció.");
  await prisma.event.update({ where: { id: eventId }, data: { inviteToken: randomUUID() } });
  revalidatePath(`${eventPath(eventId)}/settings`);
  redirect(`${eventPath(eventId)}/settings?regenerated=1`);
}

export async function updateReservationPrivacy(data: FormData) {
  const eventId = text(data, "eventId");
  const { membership } = await requireMembership(eventId);
  if (!isManager(membership.role)) fail(`${eventPath(eventId)}/settings`, "No tens permisos per canviar aquesta opció.");
  await prisma.event.update({ where: { id: eventId }, data: { hideReservationFromOwner: data.get("hideReservationFromOwner") === "on" } });
  revalidatePath(eventPath(eventId));
  revalidatePath(`${eventPath(eventId)}/settings`);
  redirect(`${eventPath(eventId)}/settings?saved=1`);
}

export async function updateManagerScope(data: FormData) {
  const eventId = text(data, "eventId");
  const targetUserId = text(data, "userId");
  const managesAllLists = data.get("managesAllLists") === "on";
  const { user, membership } = await requireMembership(eventId);
  const target = await prisma.eventMember.findUnique({ where: { eventId_userId: { eventId, userId: targetUserId } } });
  if (!target || target.role !== "ADMIN") fail(`${eventPath(eventId)}/settings`, "Aquest compte no és administrador de l’esdeveniment.");
  if (membership.role !== "OWNER" && !(membership.role === "ADMIN" && user.id === targetUserId)) fail(`${eventPath(eventId)}/settings`, "No pots canviar aquesta responsabilitat.");
  await prisma.eventMember.update({ where: { eventId_userId: { eventId, userId: targetUserId } }, data: { managesAllLists } });
  revalidatePath(`${eventPath(eventId)}/settings`);
  revalidatePath(eventPath(eventId));
  redirect(`${eventPath(eventId)}/settings?saved=1`);
}

export async function saveProfileResponsibles(data: FormData) {
  const eventId = text(data, "eventId");
  const profileUserId = text(data, "profileUserId");
  const { membership } = await requireMembership(eventId);
  if (!isManager(membership.role)) fail(`${eventPath(eventId)}/settings`, "Només un administrador pot assignar responsables.");
  const profileMember = await prisma.eventMember.findUnique({ where: { eventId_userId: { eventId, userId: profileUserId } } });
  if (!profileMember) fail(`${eventPath(eventId)}/settings`, "Aquest perfil ja no forma part de l’esdeveniment.");
  const responsibleIds = [...new Set(data.getAll("responsibleUserId").map(String).filter(Boolean))].filter((id) => id !== profileUserId);
  const candidates = responsibleIds.length ? await prisma.eventMember.findMany({
    where: { eventId, userId: { in: responsibleIds }, user: { isManagedProfile: false, email: { not: null } } },
    select: { userId: true },
  }) : [];
  if (candidates.length !== responsibleIds.length) fail(`${eventPath(eventId)}/settings`, "Tria membres amb compte vàlid com a responsables.");
  await prisma.$transaction(async (tx) => {
    await tx.profileResponsibility.deleteMany({ where: { eventId, profileUserId } });
    if (responsibleIds.length) await tx.profileResponsibility.createMany({ data: responsibleIds.map((responsibleUserId) => ({
      eventId, profileUserId, responsibleUserId, canViewList: data.get(`canViewList:${responsibleUserId}`) === "on",
    })) });
  });
  revalidatePath(`${eventPath(eventId)}/settings`);
  revalidatePath(eventPath(eventId));
  redirect(`${eventPath(eventId)}/settings?saved=1`);
}

export async function createManagedProfile(data: FormData) {
  const eventId = text(data, "eventId");
  const name = text(data, "name");
  const { user, event } = await requireMembership(eventId);
  if (event.listMode !== "EVERY_MEMBER_LIST") fail(eventPath(eventId), "Els perfils familiars només es poden crear en esdeveniments amb llistes per membre.");
  const canCreate = await canCreateManagedProfile(eventId, user.id);
  if (!canCreate) fail(eventPath(eventId), "Només un responsable pot crear un perfil familiar.");
  if (!name || name.length > 60) fail(eventPath(eventId), "El nom del perfil és obligatori (màxim 60 caràcters).");
  const token = randomBytes(24).toString("hex");
  const profile = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { name, isManagedProfile: true, profileClaimToken: token } });
    await tx.eventMember.create({ data: { eventId, userId: created.id, role: "MEMBER" } });
    await tx.profileResponsibility.create({ data: { eventId, profileUserId: created.id, responsibleUserId: user.id, canViewList: true } });
    return created;
  });
  revalidatePath(eventPath(eventId));
  redirect(`${listPath(eventId, profile.id)}?claim=${token}`);
}

export async function claimManagedProfile(data: FormData) {
  const token = text(data, "token");
  const email = text(data, "email").toLowerCase();
  const password = String(data.get("password") ?? "");
  const confirmation = String(data.get("confirmPassword") ?? "");
  const profile = await prisma.user.findUnique({ where: { profileClaimToken: token }, include: { memberships: { select: { eventId: true } } } });
  const formPath = `/claim/${encodeURIComponent(token)}`;
  if (!profile || !profile.isManagedProfile) redirect(`${formPath}?error=${encodeURIComponent("Aquest enllaç de perfil no és vàlid o ja s’ha utilitzat.")}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fail(formPath, "Introdueix un correu vàlid.");
  if (password.length < 8 || password.length > 128) fail(formPath, "La contrasenya ha de tenir entre 8 i 128 caràcters.");
  if (password !== confirmation) fail(formPath, "Les contrasenyes no coincideixen.");
  try {
    await prisma.user.update({ where: { id: profile.id }, data: { email, passwordHash: await hashPassword(password), isManagedProfile: false, profileClaimToken: null } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") fail(formPath, "Ja existeix un compte amb aquest correu.");
    throw error;
  }
  await createSession(profile.id);
  redirect(profile.memberships[0] ? eventPath(profile.memberships[0].eventId) : "/");
}

async function removeMemberFromEvent(eventId: string, userId: string) {
  const images = await prisma.$transaction(async (tx) => {
    const ownedItems = await tx.item.findMany({ where: { eventId, listOwnerId: userId }, select: { imagePath: true } });
    await tx.item.deleteMany({ where: { eventId, listOwnerId: userId } });
    const reservations = await tx.item.findMany({ where: { eventId, reservedById: userId }, select: { id: true } });
    if (reservations.length) {
      await tx.itemContribution.deleteMany({ where: { itemId: { in: reservations.map((item) => item.id) } } });
      await tx.item.updateMany({ where: { eventId, reservedById: userId }, data: { reservedById: null, reservedAt: null, reservationMode: "NONE", helpersNeeded: null } });
    }
    await tx.itemContribution.deleteMany({ where: { userId, item: { eventId } } });
    await tx.profileResponsibility.deleteMany({ where: { eventId, profileUserId: userId } });
    await tx.eventMember.delete({ where: { eventId_userId: { eventId, userId } } });
    const profile = await tx.user.findUnique({ where: { id: userId }, select: { isManagedProfile: true } });
    if (profile?.isManagedProfile) await tx.user.delete({ where: { id: userId } });
    return ownedItems.map((item) => item.imagePath);
  });
  await Promise.all(images.map(removeImage));
}

export async function removeEventMember(data: FormData) {
  const eventId = text(data, "eventId");
  const targetUserId = text(data, "userId");
  const { membership, event } = await requireMembership(eventId);
  if (!isManager(membership.role)) fail(eventPath(eventId), "No tens permisos per eliminar membres.");
  if (targetUserId === membership.userId) fail(`${eventPath(eventId)}/settings`, "Fes servir l’opció d’abandonar l’esdeveniment.");
  const target = await prisma.eventMember.findUnique({ where: { eventId_userId: { eventId, userId: targetUserId } }, include: { user: true } });
  if (!target) redirect(`${eventPath(eventId)}/settings?error=${encodeURIComponent("Aquest membre ja no forma part de l’esdeveniment.")}`);
  if (target.role === "OWNER" || event.ownerId === targetUserId) fail(`${eventPath(eventId)}/settings`, "No es pot eliminar el propietari de l’esdeveniment.");
  if (event.primaryListOwnerId === targetUserId) fail(`${eventPath(eventId)}/settings`, "Canvia primer la persona propietària de la llista principal.");
  if (membership.role === "ADMIN" && target.role !== "MEMBER") fail(`${eventPath(eventId)}/settings`, "Un administrador només pot eliminar membres normals.");
  if (await prisma.profileResponsibility.count({ where: { eventId, responsibleUserId: targetUserId } })) fail(`${eventPath(eventId)}/settings`, "Reassigna primer els perfils familiars que gestiona aquesta persona.");
  await removeMemberFromEvent(eventId, targetUserId);
  revalidatePath(eventPath(eventId));
  revalidatePath(`${eventPath(eventId)}/settings`);
  revalidatePath("/");
  redirect(text(data, "returnTo") === "event" ? `${eventPath(eventId)}?removed=1` : `${eventPath(eventId)}/settings?saved=1`);
}

// Organizers (owner and admins) can empty someone's list without removing them from the event.
export async function clearMemberList(data: FormData) {
  const eventId = text(data, "eventId");
  const targetUserId = text(data, "userId");
  const { membership } = await requireMembership(eventId);
  const target = listPath(eventId, targetUserId);
  if (!isManager(membership.role)) fail(target, "No tens permisos per fer aquesta acció.");
  const targetMember = await prisma.eventMember.findUnique({ where: { eventId_userId: { eventId, userId: targetUserId } } });
  if (!targetMember) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("Aquest membre ja no forma part de l’esdeveniment.")}`);
  if (membership.role === "ADMIN" && targetMember.role !== "MEMBER" && targetUserId !== membership.userId) fail(target, "Un administrador només pot buidar llistes de membres normals.");
  const images = await prisma.$transaction(async (tx) => {
    const items = await tx.item.findMany({ where: { eventId, listOwnerId: targetUserId }, select: { imagePath: true } });
    await tx.item.deleteMany({ where: { eventId, listOwnerId: targetUserId } });
    return items.map((item) => item.imagePath);
  });
  await Promise.all(images.map(removeImage));
  revalidatePath(eventPath(eventId));
  revalidatePath(target);
  redirect(`${target}?cleared=1`);
}

// Rename a family profile (a profile without an account). People with an account choose their own name.
export async function renameManagedProfile(data: FormData) {
  const eventId = text(data, "eventId");
  const profileUserId = text(data, "userId");
  const name = text(data, "name");
  const returnTo = text(data, "returnTo") === "settings" ? `${eventPath(eventId)}/settings` : listPath(eventId, profileUserId);
  const { user, membership } = await requireMembership(eventId);
  const profileMember = await prisma.eventMember.findUnique({ where: { eventId_userId: { eventId, userId: profileUserId } }, include: { user: true } });
  if (!profileMember) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("Aquest perfil ja no forma part de l’esdeveniment.")}`);
  if (!profileMember.user.isManagedProfile) fail(returnTo, "Només es pot canviar el nom dels perfils familiars.");
  const responsible = await prisma.profileResponsibility.count({ where: { eventId, profileUserId, responsibleUserId: user.id } });
  if (!isManager(membership.role) && !responsible) fail(returnTo, "No tens permisos per fer aquesta acció.");
  if (!name || name.length > 60) fail(returnTo, "El nom del perfil és obligatori (màxim 60 caràcters).");
  await prisma.user.update({ where: { id: profileUserId }, data: { name } });
  revalidatePath(eventPath(eventId));
  revalidatePath(`${eventPath(eventId)}/settings`);
  revalidatePath(listPath(eventId, profileUserId));
  redirect(`${returnTo}?saved=1`);
}

export async function leaveEvent(data: FormData) {
  const eventId = text(data, "eventId");
  const { user, membership, event } = await requireMembership(eventId);
  if (membership.role === "OWNER" || event.ownerId === user.id) fail(eventPath(eventId), "El propietari no pot abandonar el seu esdeveniment.");
  if (event.primaryListOwnerId === user.id) fail(eventPath(eventId), "Demana al propietari que canviï primer la persona de la llista principal.");
  if (await prisma.profileResponsibility.count({ where: { eventId, responsibleUserId: user.id } })) fail(eventPath(eventId), "Reassigna primer els perfils familiars que gestiones.");
  await removeMemberFromEvent(eventId, user.id);
  revalidatePath(eventPath(eventId));
  revalidatePath("/");
  redirect("/");
}

export async function changeMemberRole(data: FormData) {
  const eventId = text(data, "eventId");
  const userId = text(data, "userId");
  const role = text(data, "role");
  const { membership } = await requireMembership(eventId);
  if (membership.role !== "OWNER") fail(`${eventPath(eventId)}/settings`, "Només el propietari pot canviar rols.");
  if (userId === membership.userId || (role !== "ADMIN" && role !== "MEMBER")) fail(`${eventPath(eventId)}/settings`, "Aquest canvi de rol no és vàlid.");
  await prisma.eventMember.updateMany({ where: { eventId, userId, role: { not: "OWNER" } }, data: { role: role as Role, ...(role === "MEMBER" ? { managesAllLists: false } : {}) } });
  revalidatePath(`${eventPath(eventId)}/settings`);
  redirect(`${eventPath(eventId)}/settings?saved=1`);
}

function itemFields(data: FormData) {
  const name = text(data, "name");
  if (!name || name.length > 120) throw new Error("El nom del regal és obligatori (màxim 120 caràcters).");
  const description = text(data, "description");
  const price = text(data, "price");
  const category = text(data, "category");
  const notes = text(data, "notes");
  if (description.length > 1000 || price.length > 40 || category.length > 60 || notes.length > 500) throw new Error("Un dels camps supera la llargada màxima permesa.");
  const url = text(data, "url");
  if (url) {
    try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); }
    catch { throw new Error("L’enllaç ha de ser una URL http o https vàlida."); }
  }
  const priority = text(data, "priority");
  if (priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) throw new Error("La prioritat no és vàlida.");
  return {
    name, description: optional(description), url: optional(url), price: optional(price),
    priority: priority ? priority as "LOW" | "MEDIUM" | "HIGH" : null,
    category: optional(category), notes: optional(notes), isActive: data.get("isActive") === "on", isEssential: data.get("isEssential") === "on",
  };
}

export async function createItem(data: FormData) {
  const eventId = text(data, "eventId");
  const listOwnerId = text(data, "listOwnerId");
  const target = `${listPath(eventId, listOwnerId)}/items/new`;
  const { user, event, hideNewItemFromOwner } = await requireItemEditor(eventId, listOwnerId);
  let fields;
  try { fields = itemFields(data); } catch (error) { fail(target, error instanceof Error ? error.message : "No s’ha pogut desar el regal."); }
  let imagePath: string | undefined;
  try { imagePath = await saveImage(data.get("image")); } catch (error) { fail(target, error instanceof Error ? error.message : "No s’ha pogut pujar la imatge."); }
  const lastItem = await prisma.item.findFirst({ where: { eventId, listOwnerId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const sortOrder = (lastItem?.sortOrder ?? -1) + 1;
  await prisma.item.create({ data: { ...fields!, eventId, listOwnerId, createdBy: user.id, sortOrder, imagePath: imagePath ?? null, isHiddenFromListOwner: hideNewItemFromOwner } });
  revalidatePath(listPath(eventId, listOwnerId));
  redirect(listPath(eventId, listOwnerId));
}

export async function updateItem(data: FormData) {
  const eventId = text(data, "eventId");
  const itemId = text(data, "itemId");
  const existing = await prisma.item.findFirst({ where: { id: itemId, eventId } });
  if (!existing) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
  const target = `${listPath(eventId, existing.listOwnerId)}/items/${itemId}/edit`;
  await requireItemEditor(eventId, existing.listOwnerId, itemId);
  let fields;
  try { fields = itemFields(data); } catch (error) { fail(target, error instanceof Error ? error.message : "No s’ha pogut desar el regal."); }
  let imagePath: string | undefined;
  try { imagePath = await saveImage(data.get("image")); } catch (error) { fail(target, error instanceof Error ? error.message : "No s’ha pogut pujar la imatge."); }
  await prisma.item.update({ where: { id: itemId }, data: { ...fields!, ...(imagePath ? { imagePath } : {}) } });
  if (imagePath) await removeImage(existing.imagePath);
  revalidatePath(listPath(eventId, existing.listOwnerId));
  redirect(listPath(eventId, existing.listOwnerId));
}

export async function deleteItem(data: FormData) {
  const eventId = text(data, "eventId");
  const itemId = text(data, "itemId");
  const item = await prisma.item.findFirst({ where: { id: itemId, eventId } });
  if (!item) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
  await requireItemEditor(eventId, item.listOwnerId, itemId);
  await prisma.item.delete({ where: { id: itemId } });
  await removeImage(item.imagePath);
  revalidatePath(listPath(eventId, item.listOwnerId));
  redirect(listPath(eventId, item.listOwnerId));
}

export async function moveItem(data: FormData) {
  const eventId = text(data, "eventId");
  const itemId = text(data, "itemId");
  const direction = text(data, "direction");
  const item = await prisma.item.findFirst({ where: { id: itemId, eventId } });
  if (!item) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
  await requireItemEditor(eventId, item.listOwnerId, itemId);
  const items = await prisma.item.findMany({ where: { eventId, listOwnerId: item.listOwnerId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const index = items.findIndex((entry) => entry.id === itemId);
  if (index < 0) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
  if (direction !== "up" && direction !== "down") fail(listPath(eventId, item.listOwnerId), "Ordre no vàlid.");
  const adjacentIndex = index + (direction === "up" ? -1 : 1);
  if (adjacentIndex >= 0 && adjacentIndex < items.length) {
    const reordered = [...items];
    [reordered[index], reordered[adjacentIndex]] = [reordered[adjacentIndex], reordered[index]];
    await prisma.$transaction(reordered.map((entry, order) => prisma.item.update({ where: { id: entry.id }, data: { sortOrder: order } })));
  }
  revalidatePath(listPath(eventId, item.listOwnerId));
  redirect(listPath(eventId, item.listOwnerId));
}

export async function toggleItemActive(data: FormData) {
  const eventId = text(data, "eventId");
  const itemId = text(data, "itemId");
  const item = await prisma.item.findFirst({ where: { id: itemId, eventId } });
  if (!item) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
  await requireItemEditor(eventId, item.listOwnerId, itemId);
  await prisma.item.update({ where: { id: itemId }, data: { isActive: !item.isActive } });
  revalidatePath(listPath(eventId, item.listOwnerId));
  redirect(listPath(eventId, item.listOwnerId));
}

export async function toggleItemEssential(data: FormData) {
  const eventId = text(data, "eventId");
  const itemId = text(data, "itemId");
  const item = await prisma.item.findFirst({ where: { id: itemId, eventId } });
  if (!item) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
  await requireItemEditor(eventId, item.listOwnerId, itemId);
  await prisma.item.update({ where: { id: itemId }, data: { isEssential: !item.isEssential } });
  revalidatePath(listPath(eventId, item.listOwnerId));
  redirect(listPath(eventId, item.listOwnerId));
}

// A group gift is SHARED when no number is given, or HELP when it needs a set number of extra people.
function groupMode(data: FormData, target: string): { reservationMode: ReservationMode; helpersNeeded: number | null } {
  const input = text(data, "helpersNeeded");
  if (!input) return { reservationMode: "SHARED", helpersNeeded: null };
  const helpersNeeded = Number(input);
  if (!Number.isInteger(helpersNeeded) || helpersNeeded < 1 || helpersNeeded > 99) fail(target, "Indica quantes persones més necessites, entre 1 i 99.");
  return { reservationMode: "HELP", helpersNeeded };
}

export async function reserveItem(data: FormData) {
  const eventId = text(data, "eventId");
  const itemId = text(data, "itemId");
  const { user } = await requireMembership(eventId);
  const item = await prisma.item.findFirst({ where: { id: itemId, eventId } });
  if (!item) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
  const target = listPath(eventId, item.listOwnerId);
  if (item.listOwnerId === user.id) fail(target, "No pots reservar un regal de la teva pròpia llista.");
  const mode = text(data, "group") === "1" ? groupMode(data, target) : { reservationMode: "NONE" as ReservationMode, helpersNeeded: null };
  const result = await prisma.item.updateMany({
    where: { id: itemId, eventId, isActive: true, reservedById: null },
    data: { reservedById: user.id, reservedAt: new Date(), ...mode },
  });
  if (!result.count) fail(target, "Aquest regal ja està agafat.");
  revalidatePath(target);
  redirect(target);
}

export async function unreserveItem(data: FormData) {
  const eventId = text(data, "eventId");
  const itemId = text(data, "itemId");
  const { user, membership } = await requireMembership(eventId);
  const item = await prisma.item.findFirst({ where: { id: itemId, eventId } });
  if (!item) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
  const target = listPath(eventId, item.listOwnerId);
  if (item.reservedById !== user.id && !(await canModerateItemReservations(eventId, item, user.id))) fail(target, "No tens permisos per desmarcar aquest regal.");
  await prisma.$transaction([
    prisma.item.update({ where: { id: itemId }, data: { reservedById: null, reservedAt: null, reservationMode: "NONE", helpersNeeded: null } }),
    prisma.itemContribution.deleteMany({ where: { itemId } }),
  ]);
  revalidatePath(target);
  redirect(target);
}

export async function changeReservationMode(data: FormData) {
  const eventId = text(data, "eventId");
  const itemId = text(data, "itemId");
  const mode = text(data, "mode");
  const helpersNeededInput = text(data, "helpersNeeded");
  const { user, membership } = await requireMembership(eventId);
  if (!(["NONE", "HELP", "SHARED", "GROUP"] as string[]).includes(mode)) fail(eventPath(eventId), "El tipus de regal no és vàlid.");
  const item = await prisma.item.findFirst({ where: { id: itemId, eventId } });
  if (!item) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
  const target = listPath(eventId, item.listOwnerId);
  if (item.reservedById !== user.id && !(await canModerateItemReservations(eventId, item, user.id))) fail(target, "Només qui ha reservat o un responsable d’aquesta llista pot canviar aquest estat.");
  if (!item.reservedById) fail(target, "Primer has de reservar el regal.");
  let next: { reservationMode: ReservationMode; helpersNeeded: number | null };
  if (mode === "GROUP") next = groupMode(data, target);
  else {
    const helpersNeeded = mode === "HELP" ? Number(helpersNeededInput) : null;
    if (mode === "HELP" && (!Number.isInteger(helpersNeeded) || helpersNeeded! < 1 || helpersNeeded! > 99)) {
      fail(target, "Indica quantes persones més necessites, entre 1 i 99.");
    }
    next = { reservationMode: mode as ReservationMode, helpersNeeded };
  }
  await prisma.$transaction(async (tx) => {
    await tx.item.update({ where: { id: itemId }, data: next });
    if (next.reservationMode === "NONE") await tx.itemContribution.deleteMany({ where: { itemId } });
  });
  revalidatePath(target);
  redirect(target);
}

export async function addContribution(data: FormData) {
  const eventId = text(data, "eventId");
  const itemId = text(data, "itemId");
  const note = text(data, "note").slice(0, 160);
  const { user } = await requireMembership(eventId);
  const item = await prisma.item.findFirst({ where: { id: itemId, eventId } });
  if (!item) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
  const target = listPath(eventId, item.listOwnerId);
  if (user.id === item.listOwnerId) fail(target, "No pots contribuir al teu propi regal.");
  if (user.id === item.reservedById) fail(target, "Ja ets la persona que organitza aquest regal.");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Item" WHERE "id" = ${itemId} AND "eventId" = ${eventId} FOR UPDATE`;
      const lockedItem = await tx.item.findFirst({ where: { id: itemId, eventId } });
      if (!lockedItem) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat el regal.")}`);
      if (lockedItem.reservationMode === "NONE" || !lockedItem.reservedById) fail(target, "Aquest regal no demana ajuda ni és compartit.");
      if (lockedItem.reservedById === user.id) fail(target, "Ja ets la persona que organitza aquest regal.");
      if (lockedItem.reservationMode === "HELP") {
        const currentHelpers = await tx.itemContribution.count({ where: { itemId } });
        if (currentHelpers >= (lockedItem.helpersNeeded ?? 0)) fail(target, "Ja hi ha prou persones ajudant en aquest regal.");
      }
      await tx.itemContribution.create({ data: { itemId, userId: user.id, note: optional(note) } });
    });
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") fail(target, "Ja formes part d’aquest regal.");
    throw error;
  }
  revalidatePath(target);
  redirect(target);
}

export async function removeContribution(data: FormData) {
  const eventId = text(data, "eventId");
  const contributionId = text(data, "contributionId");
  const { user, membership } = await requireMembership(eventId);
  const contribution = await prisma.itemContribution.findFirst({ where: { id: contributionId, item: { eventId } }, include: { item: true } });
  if (!contribution) redirect(`${eventPath(eventId)}?error=${encodeURIComponent("No s’ha trobat la contribució.")}`);
  const target = listPath(eventId, contribution.item.listOwnerId);
  if (contribution.userId !== user.id && contribution.item.reservedById !== user.id && !(await canModerateItemReservations(eventId, contribution.item, user.id))) fail(target, "No tens permisos per eliminar aquesta contribució.");
  await prisma.itemContribution.delete({ where: { id: contributionId } });
  revalidatePath(target);
  redirect(target);
}
