/**
 * Development seed: one fake user with one fake home, the default checklist,
 * a few rooms and vendors, and some progress so the UI has something to show.
 * Idempotent: if the dev user already has a home, nothing is changed.
 *
 *   pnpm db:seed
 *
 * Everything here is invented sample data.
 */
import { addDays, format } from "date-fns";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { adminDb, closeDb, withUser } from "@/db/client";
import { homeMembers, homes, modules, profiles, rooms, tasks, vendors } from "@/db/schema";
import { initHomeDefaults, seedHome } from "@/db/seed-home";
import { getDevUser, markDevVerified, setDevPassword } from "@/lib/auth/dev-backend";

const DEV_EMAIL = "asha@homeshift.local";
const DEV_NAME = "Asha Rao";
/** Local dev backend only. Shown by the seed so you can log in. */
const DEV_PASSWORD = "homeshift123";
const DEV_MOBILE = "+919000000010";

const day = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");

const ROOMS = [
  { name: "Living room", areaSqft: 320 },
  { name: "Master bedroom", areaSqft: 180 },
  { name: "Kids room", areaSqft: 140 },
  { name: "Kitchen", areaSqft: 110 },
  { name: "Balcony", areaSqft: 60 },
];

const VENDORS = [
  {
    name: "Ravi Painters",
    trade: "painter",
    phone: "+91 90000 00001",
    rating: 4,
    status: "quote_received",
  },
  {
    name: "Sharma Woodworks",
    trade: "carpenter",
    phone: "+91 90000 00002",
    rating: 5,
    status: "appointed",
  },
  {
    name: "BrightSpark Electricals",
    trade: "electrician",
    phone: "+91 90000 00003",
    rating: 4,
    status: "contacted",
  },
] as const;

/** Module name -> how many of its first top-level tasks are done, and whether the next is in progress. */
const PROGRESS: Record<string, { done: number; inProgress: boolean }> = {
  "Planning and setup": { done: 4, inProgress: false },
  "Site inspection and snag list": { done: 3, inProgress: true },
  Painting: { done: 2, inProgress: true },
};

async function ensureUser(): Promise<string> {
  const db = adminDb();
  const [existing] = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, DEV_EMAIL));
  const id =
    existing?.id ??
    (
      await db
        .insert(authUsers)
        .values({ id: crypto.randomUUID(), email: DEV_EMAIL })
        .returning({ id: authUsers.id })
    )[0].id;
  await db
    .insert(profiles)
    .values({
      userId: id,
      displayName: DEV_NAME,
      username: "asha",
      email: DEV_EMAIL,
      mobile: DEV_MOBILE,
    })
    .onConflictDoUpdate({ target: profiles.userId, set: { mobile: DEV_MOBILE } });

  // Local dev backend: give the demo user a password, a phone and verified contacts.
  const user = await getDevUser(id);
  if (user && !user.encryptedPassword) await setDevPassword(id, DEV_PASSWORD);
  await db.execute(
    sql`update auth.users set phone = ${DEV_MOBILE} where id = ${id} and phone is null`,
  );
  await markDevVerified(id, "email");
  await markDevVerified(id, "mobile");
  return id;
}

async function main(): Promise<void> {
  const userId = await ensureUser();

  const result = await withUser(userId, async (tx) => {
    const owned = await tx.select({ id: homes.id }).from(homes).limit(1);
    if (owned.length > 0) return null;

    const moveInDate = day(57);
    const [home] = await tx
      .insert(homes)
      .values({
        ownerId: userId,
        name: "Palm Grove 3BHK",
        address: "Flat 704, Tower B, Palm Grove, Whitefield, Bengaluru 560066",
        buildingName: "Palm Grove Tower B",
        floorLabel: "7",
        bhk: "3 BHK",
        possessionDate: day(-30),
        moveInDate,
        totalBudget: 800000,
        currency: "INR",
      })
      .returning({ id: homes.id });
    await tx.insert(homeMembers).values({ homeId: home.id, userId, role: "owner" });

    const floorId = await initHomeDefaults(tx, home.id, "INR");
    const counts = await seedHome(tx, home.id, moveInDate);
    await tx
      .insert(rooms)
      .values(ROOMS.map((room, i) => ({ ...room, homeId: home.id, floorId, sortOrder: i })));
    await tx.insert(vendors).values(VENDORS.map((vendor) => ({ ...vendor, homeId: home.id })));

    const progressModules = await tx
      .select({ id: modules.id, name: modules.name })
      .from(modules)
      .where(and(eq(modules.homeId, home.id), inArray(modules.name, Object.keys(PROGRESS))));
    for (const mod of progressModules) {
      const plan = PROGRESS[mod.name];
      const top = await tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.moduleId, mod.id), isNull(tasks.parentTaskId)))
        .orderBy(asc(tasks.sortOrder));
      const doneIds = top.slice(0, plan.done).map((t) => t.id);
      if (doneIds.length)
        await tx.update(tasks).set({ status: "done" }).where(inArray(tasks.id, doneIds));
      const next = top[plan.done];
      if (plan.inProgress && next) {
        await tx.update(tasks).set({ status: "in_progress" }).where(eq(tasks.id, next.id));
      }
    }
    return counts;
  });

  if (result) {
    console.log(`Seeded "Palm Grove 3BHK": ${result.modules} modules, ${result.tasks} tasks.`);
  } else {
    console.log("Dev user already has a home; nothing to seed.");
  }
  console.log(
    `Log in at /login as "asha", ${DEV_EMAIL} or ${DEV_MOBILE} with password "${DEV_PASSWORD}"`,
  );
}

try {
  await main();
} finally {
  await closeDb();
}
