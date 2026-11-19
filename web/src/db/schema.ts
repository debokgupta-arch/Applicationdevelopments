/**
 * GrihaPravesh database schema (v2, see docs/v2-gap-analysis.md).
 *
 * Row-level security: every table has RLS enabled with policies for the
 * Supabase `authenticated` role. Membership checks go through SECURITY DEFINER
 * helpers (drizzle/0000_rls_helpers.sql, 0003_v2_helpers.sql) so policies never
 * recurse into home_members' own RLS. Viewers can read; owners and editors write.
 */
import { relations, sql, type SQL } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// ---------------------------------------------------------------- custom types

/** Case-insensitive text (Postgres citext extension, created in 0003). */
const citext = customType<{ data: string }>({ dataType: () => "citext" });

// ---------------------------------------------------------------- enums

export const memberRole = pgEnum("member_role", ["owner", "editor", "viewer"]);
/** "pending" is shown to users as "Not started" (see docs/v2-gap-analysis.md). */
export const taskStatus = pgEnum("task_status", [
  "pending",
  "in_progress",
  "done",
  "skipped",
  "blocked",
]);
export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"]);
export const taskLevel = pgEnum("task_level", ["task", "subtask"]);
export const taskType = pgEnum("task_type", [
  "plain",
  "selection",
  "contact",
  "cost_monitor",
  "schedule",
  "space_progress",
  "line_items",
  "stages",
]);
export const paintFinish = pgEnum("paint_finish", ["matte", "satin", "gloss"]);
export const vendorTrade = pgEnum("vendor_trade", [
  "painter",
  "carpenter",
  "electrician",
  "plumber",
  "mover",
  "other",
]);
export const vendorStatus = pgEnum("vendor_status", ["contacted", "quote_received", "appointed"]);
export const paymentStatus = pgEnum("payment_status", ["due", "paid"]);
export const attachmentType = pgEnum("attachment_type", ["image", "pdf", "document"]);
export const attachmentKind = pgEnum("attachment_kind", [
  "design",
  "invoice",
  "warranty",
  "installation",
  "plan",
  "photo",
  "receipt",
  "other",
]);
export const areaUnit = pgEnum("area_unit", ["sqft", "sqm"]);

// ---------------------------------------------------------------- shared columns

const id = () => uuid("id").primaryKey().defaultRandom();
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
const money = (name: string) => numeric(name, { precision: 14, scale: 2, mode: "number" });
const qty = (name: string) => numeric(name, { precision: 12, scale: 3, mode: "number" });
const day = (name: string) => date(name, { mode: "string" });
/** Planned and actual start/end dates shared by tasks, line items and stages. */
const schedule = () => ({
  plannedStart: day("planned_start"),
  plannedEnd: day("planned_end"),
  actualStart: day("actual_start"),
  actualEnd: day("actual_end"),
});

// ---------------------------------------------------------------- policy helpers

const isMember = (homeId: SQL | AnyPgColumn) => sql`public.is_home_member(${homeId})`;
const canEdit = (homeId: SQL | AnyPgColumn) => sql`public.can_edit_home(${homeId})`;
const moduleHome = (moduleId: AnyPgColumn) => sql`public.module_home_id(${moduleId})`;
const taskHome = (taskId: AnyPgColumn) => sql`public.task_home_id(${taskId})`;
const lineItemHome = (lineItemId: AnyPgColumn) => sql`public.line_item_home_id(${lineItemId})`;

/** select for members; insert/update/delete for owners and editors. */
function homeScopedPolicies(name: string, homeId: SQL | AnyPgColumn) {
  return [
    pgPolicy(`${name}_select_members`, {
      for: "select",
      to: authenticatedRole,
      using: isMember(homeId),
    }),
    pgPolicy(`${name}_insert_editors`, {
      for: "insert",
      to: authenticatedRole,
      withCheck: canEdit(homeId),
    }),
    pgPolicy(`${name}_update_editors`, {
      for: "update",
      to: authenticatedRole,
      using: canEdit(homeId),
      withCheck: canEdit(homeId),
    }),
    pgPolicy(`${name}_delete_editors`, {
      for: "delete",
      to: authenticatedRole,
      using: canEdit(homeId),
    }),
  ];
}

// ---------------------------------------------------------------- people and homes

export const profiles = pgTable(
  "profiles",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    username: citext("username").notNull().unique(),
    /** E.164, e.g. +919000000001 */
    mobile: text("mobile").unique(),
    email: citext("email").unique(),
    ...timestamps,
  },
  (t) => [
    pgPolicy("profiles_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}`,
    }),
    pgPolicy("profiles_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${t.userId} = ${authUid}`,
    }),
    pgPolicy("profiles_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}`,
      withCheck: sql`${t.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export const homes = pgTable(
  "homes",
  {
    id: id(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address").notNull(),
    buildingName: text("building_name"),
    /** The flat's floor in the building, e.g. "7" or "Ground". */
    floorLabel: text("floor_label"),
    bhk: text("bhk"),
    possessionDate: day("possession_date"),
    moveInDate: day("move_in_date"),
    totalBudget: money("total_budget"),
    currency: text("currency").notNull().default("INR"),
    ...timestamps,
  },
  (t) => [
    index("homes_owner_id_idx").on(t.ownerId),
    // The owner can see the row before their membership exists (needed for INSERT ... RETURNING).
    pgPolicy("homes_select_members", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.ownerId} = ${authUid} or ${isMember(t.id)}`,
    }),
    pgPolicy("homes_insert_self_owner", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${t.ownerId} = ${authUid}`,
    }),
    pgPolicy("homes_update_editors", {
      for: "update",
      to: authenticatedRole,
      using: canEdit(t.id),
      withCheck: canEdit(t.id),
    }),
    pgPolicy("homes_delete_owner", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${t.ownerId} = ${authUid}`,
    }),
  ],
).enableRLS();

export const homeMembers = pgTable(
  "home_members",
  {
    id: id(),
    homeId: uuid("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("home_members_home_user_uidx").on(t.homeId, t.userId),
    index("home_members_user_id_idx").on(t.userId),
    pgPolicy("home_members_select_members", {
      for: "select",
      to: authenticatedRole,
      using: isMember(t.homeId),
    }),
    pgPolicy("home_members_insert_owner", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`public.is_home_owner(${t.homeId})`,
    }),
    pgPolicy("home_members_update_owner", {
      for: "update",
      to: authenticatedRole,
      using: sql`public.is_home_owner(${t.homeId})`,
      withCheck: sql`public.is_home_owner(${t.homeId})`,
    }),
    pgPolicy("home_members_delete_owner", {
      for: "delete",
      to: authenticatedRole,
      using: sql`public.is_home_owner(${t.homeId})`,
    }),
  ],
).enableRLS();

/** Per-home preferences (dashboard thresholds, units). One row per home. */
export const appSettings = pgTable(
  "app_settings",
  {
    id: id(),
    homeId: uuid("home_id")
      .notNull()
      .unique()
      .references(() => homes.id, { onDelete: "cascade" }),
    costTolerancePct: numeric("cost_tolerance_pct", { precision: 5, scale: 2, mode: "number" })
      .notNull()
      .default(10),
    atRiskDays: integer("at_risk_days").notNull().default(3),
    areaUnit: areaUnit("area_unit").notNull().default("sqft"),
    currency: text("currency").notNull().default("INR"),
    ...timestamps,
  },
  (t) => [...homeScopedPolicies("app_settings", t.homeId)],
).enableRLS();

// ---------------------------------------------------------------- floors and rooms

export const floors = pgTable(
  "floors",
  {
    id: id(),
    homeId: uuid("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    planStoragePath: text("plan_storage_path"),
    totalAreaSqft: numeric("total_area_sqft", { precision: 10, scale: 2, mode: "number" }),
    ...timestamps,
  },
  (t) => [index("floors_home_id_idx").on(t.homeId), ...homeScopedPolicies("floors", t.homeId)],
).enableRLS();

/** A room or space on a floor; reused by task rooms, space progress and line items. */
export const rooms = pgTable(
  "rooms",
  {
    id: id(),
    homeId: uuid("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    floorId: uuid("floor_id")
      .notNull()
      .references(() => floors.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    lengthFt: numeric("length_ft", { precision: 8, scale: 2, mode: "number" }),
    widthFt: numeric("width_ft", { precision: 8, scale: 2, mode: "number" }),
    areaSqft: numeric("area_sqft", { precision: 10, scale: 2, mode: "number" }),
    planX: numeric("plan_x", { mode: "number" }),
    planY: numeric("plan_y", { mode: "number" }),
    planW: numeric("plan_w", { mode: "number" }),
    planH: numeric("plan_h", { mode: "number" }),
    wallColorHex: text("wall_color_hex"),
    wallColorName: text("wall_color_name"),
    finish: paintFinish("finish"),
    ceilingColorHex: text("ceiling_color_hex"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("rooms_home_id_idx").on(t.homeId),
    index("rooms_floor_id_idx").on(t.floorId),
    ...homeScopedPolicies("rooms", t.homeId),
  ],
).enableRLS();

// ---------------------------------------------------------------- modules and tasks

export const modules = pgTable(
  "modules",
  {
    id: id(),
    homeId: uuid("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("ListChecks"),
    sortOrder: integer("sort_order").notNull().default(0),
    isCustom: boolean("is_custom").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),
    /** Optional; module costs roll up from tasks. */
    budget: money("budget"),
    ...timestamps,
  },
  (t) => [index("modules_home_id_idx").on(t.homeId), ...homeScopedPolicies("modules", t.homeId)],
).enableRLS();

export const vendors = pgTable(
  "vendors",
  {
    id: id(),
    homeId: uuid("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    trade: vendorTrade("trade").notNull(),
    phone: text("phone"),
    rating: smallint("rating"),
    notes: text("notes"),
    status: vendorStatus("status").notNull().default("contacted"),
    ...timestamps,
  },
  (t) => [index("vendors_home_id_idx").on(t.homeId), ...homeScopedPolicies("vendors", t.homeId)],
).enableRLS();

/** Level 2 (task) and level 3 (sub-task) of the Module > Task > Sub-task hierarchy. */
export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    parentTaskId: uuid("parent_task_id").references((): AnyPgColumn => tasks.id, {
      onDelete: "cascade",
    }),
    level: taskLevel("level").notNull().default("task"),
    taskType: taskType("task_type").notNull().default("plain"),
    title: text("title").notNull(),
    notes: text("notes"),
    status: taskStatus("status").notNull().default("pending"),
    ...schedule(),
    expectedCost: money("expected_cost"),
    actualCost: money("actual_cost"),
    /** 0-100; when set it overrides the computed progress. */
    manualProgress: smallint("manual_progress"),
    priority: taskPriority("priority").notNull().default("medium"),
    vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
    isCustom: boolean("is_custom").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("tasks_module_id_idx").on(t.moduleId),
    index("tasks_parent_task_id_idx").on(t.parentTaskId),
    index("tasks_vendor_id_idx").on(t.vendorId),
    index("tasks_planned_start_idx").on(t.plannedStart),
    index("tasks_planned_end_idx").on(t.plannedEnd),
    check(
      "tasks_manual_progress_range",
      sql`${t.manualProgress} is null or ${t.manualProgress} between 0 and 100`,
    ),
    ...homeScopedPolicies("tasks", moduleHome(t.moduleId)),
  ],
).enableRLS();

export const taskRooms = pgTable(
  "task_rooms",
  {
    id: id(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("task_rooms_task_room_uidx").on(t.taskId, t.roomId),
    index("task_rooms_room_id_idx").on(t.roomId),
    ...homeScopedPolicies("task_rooms", taskHome(t.taskId)),
  ],
).enableRLS();

// ---------------------------------------------------------------- task-type data

/** Contact task type: painters, electricians, plumbers; one can be appointed. */
export const taskContacts = pgTable(
  "task_contacts",
  {
    id: id(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    company: text("company"),
    phone: text("phone"),
    rate: money("rate"),
    isAppointed: boolean("is_appointed").notNull().default(false),
    appointedOn: day("appointed_on"),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("task_contacts_task_id_idx").on(t.taskId),
    ...homeScopedPolicies("task_contacts", taskHome(t.taskId)),
  ],
).enableRLS();

/** Selection task type: colour / item choices per space. */
export const taskSelections = pgTable(
  "task_selections",
  {
    id: id(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
    itemName: text("item_name").notNull(),
    colorHex: text("color_hex"),
    colorName: text("color_name"),
    finish: paintFinish("finish"),
    brand: text("brand"),
    quantity: qty("quantity"),
    unit: text("unit"),
    expectedCost: money("expected_cost"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("task_selections_task_id_idx").on(t.taskId),
    index("task_selections_room_id_idx").on(t.roomId),
    ...homeScopedPolicies("task_selections", taskHome(t.taskId)),
  ],
).enableRLS();

/** Cost monitor task type: payment ledger. */
export const payments = pgTable(
  "payments",
  {
    id: id(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    payee: text("payee").notNull(),
    amount: money("amount").notNull(),
    paidOn: day("paid_on"),
    mode: text("mode"),
    status: paymentStatus("status").notNull().default("due"),
    receiptPath: text("receipt_path"),
    ...timestamps,
  },
  (t) => [
    index("payments_task_id_idx").on(t.taskId),
    index("payments_paid_on_idx").on(t.paidOn),
    ...homeScopedPolicies("payments", taskHome(t.taskId)),
  ],
).enableRLS();

/** Space progress task type: % complete per room. */
export const spaceProgress = pgTable(
  "space_progress",
  {
    id: id(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    percent: smallint("percent").notNull().default(0),
    notes: text("notes"),
    photoPath: text("photo_path"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("space_progress_task_room_uidx").on(t.taskId, t.roomId),
    index("space_progress_room_id_idx").on(t.roomId),
    check("space_progress_percent_range", sql`${t.percent} between 0 and 100`),
    ...homeScopedPolicies("space_progress", taskHome(t.taskId)),
  ],
).enableRLS();

/** Line items task type: room-wise rows (furniture, appliances, fittings). */
export const lineItems = pgTable(
  "line_items",
  {
    id: id(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    floorId: uuid("floor_id").references(() => floors.id, { onDelete: "set null" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    quantity: qty("quantity"),
    unit: text("unit"),
    expectedCost: money("expected_cost"),
    actualCost: money("actual_cost"),
    ...schedule(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("line_items_task_id_idx").on(t.taskId),
    index("line_items_floor_id_idx").on(t.floorId),
    index("line_items_room_id_idx").on(t.roomId),
    index("line_items_planned_end_idx").on(t.plannedEnd),
    ...homeScopedPolicies("line_items", taskHome(t.taskId)),
  ],
).enableRLS();

export const lineItemMaterials = pgTable(
  "line_item_materials",
  {
    id: id(),
    lineItemId: uuid("line_item_id")
      .notNull()
      .references(() => lineItems.id, { onDelete: "cascade" }),
    material: text("material").notNull(),
    quantity: qty("quantity"),
    unit: text("unit"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("line_item_materials_line_item_id_idx").on(t.lineItemId),
    ...homeScopedPolicies("line_item_materials", lineItemHome(t.lineItemId)),
  ],
).enableRLS();

/** Stages task type: an ordered pipeline on a task or on a single line item. */
export const stages = pgTable(
  "stages",
  {
    id: id(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    lineItemId: uuid("line_item_id").references(() => lineItems.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    status: taskStatus("status").notNull().default("pending"),
    ...schedule(),
    amount: money("amount"),
    ...timestamps,
  },
  (t) => [
    index("stages_task_id_idx").on(t.taskId),
    index("stages_line_item_id_idx").on(t.lineItemId),
    index("stages_planned_end_idx").on(t.plannedEnd),
    check("stages_one_parent", sql`(${t.taskId} is null) <> (${t.lineItemId} is null)`),
    ...homeScopedPolicies(
      "stages",
      sql`coalesce(public.task_home_id(${t.taskId}), public.line_item_home_id(${t.lineItemId}))`,
    ),
  ],
).enableRLS();

// ---------------------------------------------------------------- vendors, files, templates

export const quotes = pgTable(
  "quotes",
  {
    id: id(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    amount: money("amount").notNull(),
    durationDays: integer("duration_days"),
    includes: text("includes"),
    isAccepted: boolean("is_accepted").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("quotes_task_id_idx").on(t.taskId),
    index("quotes_vendor_id_idx").on(t.vendorId),
    ...homeScopedPolicies("quotes", taskHome(t.taskId)),
  ],
).enableRLS();

export const attachments = pgTable(
  "attachments",
  {
    id: id(),
    homeId: uuid("home_id")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    lineItemId: uuid("line_item_id").references(() => lineItems.id, { onDelete: "set null" }),
    stageId: uuid("stage_id").references(() => stages.id, { onDelete: "set null" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
    /** File format. */
    type: attachmentType("type").notNull(),
    /** What the file is for (design, invoice, warranty, ...). */
    kind: attachmentKind("kind").notNull().default("other"),
    storagePath: text("storage_path").notNull(),
    fileName: text("file_name"),
    ...timestamps,
  },
  (t) => [
    index("attachments_home_id_idx").on(t.homeId),
    index("attachments_task_id_idx").on(t.taskId),
    index("attachments_line_item_id_idx").on(t.lineItemId),
    index("attachments_stage_id_idx").on(t.stageId),
    index("attachments_room_id_idx").on(t.roomId),
    ...homeScopedPolicies("attachments", t.homeId),
  ],
).enableRLS();

export const templates = pgTable(
  "templates",
  {
    id: id(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    payload: jsonb("payload").notNull(),
    ...timestamps,
  },
  (t) => [
    index("templates_owner_id_idx").on(t.ownerId),
    pgPolicy("templates_all_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.ownerId} = ${authUid}`,
      withCheck: sql`${t.ownerId} = ${authUid}`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------- auth support

/**
 * Sliding-window rate limiting for sign-in, OTP and reset requests. RLS is on
 * with no policies, so only the server's privileged connection can touch it.
 */
export const authRateLimits = pgTable(
  "auth_rate_limits",
  {
    id: id(),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_rate_limits_key_created_idx").on(t.key, t.createdAt)],
).enableRLS();

// ---------------------------------------------------------------- relations (query API)

export const homesRelations = relations(homes, ({ one, many }) => ({
  members: many(homeMembers),
  floors: many(floors),
  modules: many(modules),
  rooms: many(rooms),
  vendors: many(vendors),
  settings: one(appSettings, { fields: [homes.id], references: [appSettings.homeId] }),
}));

export const homeMembersRelations = relations(homeMembers, ({ one }) => ({
  home: one(homes, { fields: [homeMembers.homeId], references: [homes.id] }),
}));

export const floorsRelations = relations(floors, ({ one, many }) => ({
  home: one(homes, { fields: [floors.homeId], references: [homes.id] }),
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  home: one(homes, { fields: [rooms.homeId], references: [homes.id] }),
  floor: one(floors, { fields: [rooms.floorId], references: [floors.id] }),
  tasks: many(taskRooms),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  home: one(homes, { fields: [modules.homeId], references: [homes.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  module: one(modules, { fields: [tasks.moduleId], references: [modules.id] }),
  parent: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, { relationName: "subtasks" }),
  vendor: one(vendors, { fields: [tasks.vendorId], references: [vendors.id] }),
  rooms: many(taskRooms),
  quotes: many(quotes),
  contacts: many(taskContacts),
  selections: many(taskSelections),
  payments: many(payments),
  spaceProgress: many(spaceProgress),
  lineItems: many(lineItems),
  stages: many(stages),
}));

export const taskRoomsRelations = relations(taskRooms, ({ one }) => ({
  task: one(tasks, { fields: [taskRooms.taskId], references: [tasks.id] }),
  room: one(rooms, { fields: [taskRooms.roomId], references: [rooms.id] }),
}));

export const taskContactsRelations = relations(taskContacts, ({ one }) => ({
  task: one(tasks, { fields: [taskContacts.taskId], references: [tasks.id] }),
}));

export const taskSelectionsRelations = relations(taskSelections, ({ one }) => ({
  task: one(tasks, { fields: [taskSelections.taskId], references: [tasks.id] }),
  room: one(rooms, { fields: [taskSelections.roomId], references: [rooms.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  task: one(tasks, { fields: [payments.taskId], references: [tasks.id] }),
}));

export const spaceProgressRelations = relations(spaceProgress, ({ one }) => ({
  task: one(tasks, { fields: [spaceProgress.taskId], references: [tasks.id] }),
  room: one(rooms, { fields: [spaceProgress.roomId], references: [rooms.id] }),
}));

export const lineItemsRelations = relations(lineItems, ({ one, many }) => ({
  task: one(tasks, { fields: [lineItems.taskId], references: [tasks.id] }),
  floor: one(floors, { fields: [lineItems.floorId], references: [floors.id] }),
  room: one(rooms, { fields: [lineItems.roomId], references: [rooms.id] }),
  materials: many(lineItemMaterials),
  stages: many(stages),
}));

export const lineItemMaterialsRelations = relations(lineItemMaterials, ({ one }) => ({
  lineItem: one(lineItems, {
    fields: [lineItemMaterials.lineItemId],
    references: [lineItems.id],
  }),
}));

export const stagesRelations = relations(stages, ({ one }) => ({
  task: one(tasks, { fields: [stages.taskId], references: [tasks.id] }),
  lineItem: one(lineItems, { fields: [stages.lineItemId], references: [lineItems.id] }),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  home: one(homes, { fields: [vendors.homeId], references: [homes.id] }),
  quotes: many(quotes),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  task: one(tasks, { fields: [quotes.taskId], references: [tasks.id] }),
  vendor: one(vendors, { fields: [quotes.vendorId], references: [vendors.id] }),
}));
