// @vitest-environment node
/**
 * Row-level security, end to end against the real database: every query runs
 * through withUser(), i.e. as Supabase's `authenticated` role with a JWT sub.
 * Skipped when DATABASE_URL is not set; fails loudly if it is set but the
 * database is down (run `pnpm db:start`).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { adminDb, closeDb, withUser } from "./client";
import {
  appSettings,
  floors,
  homeMembers,
  homes,
  lineItemMaterials,
  lineItems,
  modules,
  payments,
  profiles,
  rooms,
  stages,
  tasks,
} from "./schema";
import { initHomeDefaults, seedHome } from "./seed-home";

const hasDb = Boolean(process.env.DATABASE_URL);

/** Expect a query to be rejected by a row-level security policy. */
async function expectDenied(run: Promise<unknown>) {
  const error: unknown = await run.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error, "expected the query to be rejected").not.toBeNull();
  const cause = (error as { cause?: { message?: string } }).cause;
  expect(String(cause?.message ?? error)).toMatch(/row-level security/i);
}

describe.skipIf(!hasDb)("row-level security", () => {
  const run = crypto.randomUUID().slice(0, 8);
  const ids = { owner: "", viewer: "", stranger: "" };
  let homeId = "";
  let moduleId = "";
  let taskId = "";
  let floorId = "";
  let lineItemId = "";

  beforeAll(async () => {
    const db = adminDb();
    const created = await db
      .insert(authUsers)
      .values([
        { id: crypto.randomUUID(), email: `owner-${run}@test.local` },
        { id: crypto.randomUUID(), email: `viewer-${run}@test.local` },
        { id: crypto.randomUUID(), email: `stranger-${run}@test.local` },
      ])
      .returning({ id: authUsers.id });
    [ids.owner, ids.viewer, ids.stranger] = created.map((u) => u.id);
    await db
      .insert(profiles)
      .values({ userId: ids.owner, displayName: "Owner", username: `owner_${run}` });

    // The owner sets up a home exactly like onboarding does, under RLS, plus
    // one row in each v2 task-type table so their policies get exercised.
    homeId = await withUser(ids.owner, async (tx) => {
      const [home] = await tx
        .insert(homes)
        .values({
          ownerId: ids.owner,
          name: `RLS test ${run}`,
          address: "1 Test Street",
          moveInDate: "2027-03-01",
        })
        .returning({ id: homes.id });
      await tx.insert(homeMembers).values({ homeId: home.id, userId: ids.owner, role: "owner" });
      floorId = await initHomeDefaults(tx, home.id, "INR");
      await seedHome(tx, home.id, "2027-03-01");
      await tx.insert(homeMembers).values({ homeId: home.id, userId: ids.viewer, role: "viewer" });
      return home.id;
    });

    const [mod] = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.homeId, homeId))
      .limit(1);
    const [firstTask] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.moduleId, mod.id))
      .limit(1);

    await withUser(ids.owner, async (tx) => {
      const [room] = await tx
        .insert(rooms)
        .values({ homeId, floorId, name: "Living", lengthFt: 16, widthFt: 20, areaSqft: 320 })
        .returning({ id: rooms.id });
      const [item] = await tx
        .insert(lineItems)
        .values({ taskId: firstTask.id, floorId, roomId: room.id, name: "Wardrobe" })
        .returning({ id: lineItems.id });
      lineItemId = item.id;
      await tx.insert(lineItemMaterials).values({ lineItemId, material: "Plywood", quantity: 6 });
      await tx.insert(stages).values({ lineItemId, name: "Quote received" });
      await tx
        .insert(payments)
        .values({ taskId: firstTask.id, payee: "Paint store", amount: 1200 });
    });

    moduleId = mod.id;
    taskId = firstTask.id;
  });

  afterAll(async () => {
    if (ids.owner) {
      // Deleting the users cascades to the home, its members, modules and tasks.
      await adminDb()
        .delete(authUsers)
        .where(inArray(authUsers.id, Object.values(ids).filter(Boolean)));
    }
    await closeDb();
  });

  it("lets the owner read and edit their home", async () => {
    await withUser(ids.owner, async (tx) => {
      expect(await tx.select().from(homes).where(eq(homes.id, homeId))).toHaveLength(1);
      expect((await tx.select().from(modules).where(eq(modules.homeId, homeId))).length).toBe(14);
      const updated = await tx
        .update(tasks)
        .set({ status: "done" })
        .where(eq(tasks.id, taskId))
        .returning({ id: tasks.id });
      expect(updated).toHaveLength(1);
    });
  });

  it("hides everything from a non-member", async () => {
    await withUser(ids.stranger, async (tx) => {
      expect(await tx.select().from(homes).where(eq(homes.id, homeId))).toHaveLength(0);
      expect(await tx.select().from(modules).where(eq(modules.homeId, homeId))).toHaveLength(0);
      expect(await tx.select().from(tasks).where(eq(tasks.moduleId, moduleId))).toHaveLength(0);
      expect(
        await tx.select().from(homeMembers).where(eq(homeMembers.homeId, homeId)),
      ).toHaveLength(0);
      expect(await tx.select().from(profiles).where(eq(profiles.userId, ids.owner))).toHaveLength(
        0,
      );

      const updated = await tx
        .update(tasks)
        .set({ title: "hijacked" })
        .where(eq(tasks.id, taskId))
        .returning({ id: tasks.id });
      expect(updated).toHaveLength(0);
    });
  });

  it("stops a non-member from writing into the home or joining it", async () => {
    await expectDenied(
      withUser(ids.stranger, (tx) => tx.insert(tasks).values({ moduleId, title: "sneaky" })),
    );
    await expectDenied(
      withUser(ids.stranger, (tx) =>
        tx.insert(homeMembers).values({ homeId, userId: ids.stranger, role: "editor" }),
      ),
    );
  });

  it("stops a user from creating a home owned by someone else", async () => {
    await expectDenied(
      withUser(ids.stranger, (tx) =>
        tx.insert(homes).values({ ownerId: ids.owner, name: "fake", address: "x" }),
      ),
    );
  });

  it("gives viewers read-only access", async () => {
    await withUser(ids.viewer, async (tx) => {
      expect(await tx.select().from(homes).where(eq(homes.id, homeId))).toHaveLength(1);
      expect(
        (await tx.select().from(tasks).where(eq(tasks.moduleId, moduleId))).length,
      ).toBeGreaterThan(0);
      const updated = await tx
        .update(tasks)
        .set({ status: "skipped" })
        .where(eq(tasks.id, taskId))
        .returning({ id: tasks.id });
      expect(updated).toHaveLength(0);
    });
    await expectDenied(
      withUser(ids.viewer, (tx) => tx.insert(tasks).values({ moduleId, title: "nope" })),
    );
    await expectDenied(
      withUser(ids.viewer, (tx) =>
        tx.insert(homeMembers).values({ homeId, userId: ids.stranger, role: "viewer" }),
      ),
    );
  });

  it("applies the same rules to the v2 tables", async () => {
    const counts = async (userId: string) =>
      withUser(userId, async (tx) => ({
        floors: (await tx.select().from(floors).where(eq(floors.homeId, homeId))).length,
        settings: (await tx.select().from(appSettings).where(eq(appSettings.homeId, homeId)))
          .length,
        items: (await tx.select().from(lineItems).where(eq(lineItems.id, lineItemId))).length,
        materials: (
          await tx
            .select()
            .from(lineItemMaterials)
            .where(eq(lineItemMaterials.lineItemId, lineItemId))
        ).length,
        stages: (await tx.select().from(stages).where(eq(stages.lineItemId, lineItemId))).length,
        payments: (await tx.select().from(payments).where(eq(payments.taskId, taskId))).length,
      }));

    const visible = { floors: 1, settings: 1, items: 1, materials: 1, stages: 1, payments: 1 };
    expect(await counts(ids.owner)).toEqual(visible);
    expect(await counts(ids.viewer)).toEqual(visible);
    expect(await counts(ids.stranger)).toEqual({
      floors: 0,
      settings: 0,
      items: 0,
      materials: 0,
      stages: 0,
      payments: 0,
    });

    // Viewers and strangers can't write task-type data (including via a line item's stage).
    for (const userId of [ids.viewer, ids.stranger]) {
      await expectDenied(
        withUser(userId, (tx) => tx.insert(stages).values({ lineItemId, name: "Sneaky stage" })),
      );
      await expectDenied(
        withUser(userId, (tx) =>
          tx.insert(lineItemMaterials).values({ lineItemId, material: "Sneaky" }),
        ),
      );
      await expectDenied(
        withUser(userId, (tx) => tx.insert(floors).values({ homeId, label: "Sneaky floor" })),
      );
    }
  });

  it("rejects a stage attached to both a task and a line item", async () => {
    const error: unknown = await withUser(ids.owner, (tx) =>
      tx.insert(stages).values({ taskId, lineItemId, name: "Ambiguous" }),
    ).then(
      () => null,
      (e: unknown) => e,
    );
    const cause = (error as { cause?: { message?: string } } | null)?.cause;
    expect(String(cause?.message)).toMatch(/stages_one_parent/);
  });

  it("keeps updated_at current via the trigger", async () => {
    const before = await adminDb()
      .select({ at: tasks.updatedAt })
      .from(tasks)
      .where(eq(tasks.id, taskId));
    await withUser(ids.owner, (tx) =>
      tx.update(tasks).set({ notes: "touched" }).where(eq(tasks.id, taskId)),
    );
    const after = await adminDb()
      .select({ at: tasks.updatedAt })
      .from(tasks)
      .where(eq(tasks.id, taskId));
    expect(after[0].at.getTime()).toBeGreaterThan(before[0].at.getTime());
  });
});
