CREATE TYPE "public"."area_unit" AS ENUM('sqft', 'sqm');--> statement-breakpoint
CREATE TYPE "public"."attachment_kind" AS ENUM('design', 'invoice', 'warranty', 'installation', 'plan', 'photo', 'receipt', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('due', 'paid');--> statement-breakpoint
CREATE TYPE "public"."task_level" AS ENUM('task', 'subtask');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('plain', 'selection', 'contact', 'cost_monitor', 'schedule', 'space_progress', 'line_items', 'stages');--> statement-breakpoint
ALTER TYPE "public"."task_status" ADD VALUE 'blocked';--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"cost_tolerance_pct" numeric(5, 2) DEFAULT 10 NOT NULL,
	"at_risk_days" integer DEFAULT 3 NOT NULL,
	"area_unit" "area_unit" DEFAULT 'sqft' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_home_id_unique" UNIQUE("home_id")
);
--> statement-breakpoint
ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "floors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"plan_storage_path" text,
	"total_area_sqft" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "floors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "line_item_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"line_item_id" uuid NOT NULL,
	"material" text NOT NULL,
	"quantity" numeric(12, 3),
	"unit" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "line_item_materials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"floor_id" uuid,
	"room_id" uuid,
	"name" text NOT NULL,
	"quantity" numeric(12, 3),
	"unit" text,
	"expected_cost" numeric(14, 2),
	"actual_cost" numeric(14, 2),
	"planned_start" date,
	"planned_end" date,
	"actual_start" date,
	"actual_end" date,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"payee" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"paid_on" date,
	"mode" text,
	"status" "payment_status" DEFAULT 'due' NOT NULL,
	"receipt_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "space_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"percent" smallint DEFAULT 0 NOT NULL,
	"notes" text,
	"photo_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "space_progress_percent_range" CHECK ("space_progress"."percent" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "space_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"line_item_id" uuid,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"planned_start" date,
	"planned_end" date,
	"actual_start" date,
	"actual_end" date,
	"amount" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stages_one_parent" CHECK (("stages"."task_id" is null) <> ("stages"."line_item_id" is null))
);
--> statement-breakpoint
ALTER TABLE "stages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "task_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"phone" text,
	"rate" numeric(14, 2),
	"is_appointed" boolean DEFAULT false NOT NULL,
	"appointed_on" date,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "task_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"room_id" uuid,
	"item_name" text NOT NULL,
	"color_hex" text,
	"color_name" text,
	"finish" "paint_finish",
	"brand" text,
	"quantity" numeric(12, 3),
	"unit" text,
	"expected_cost" numeric(14, 2),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_selections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "line_item_id" uuid;--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "stage_id" uuid;--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "kind" "attachment_kind" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "homes" ADD COLUMN "building_name" text;--> statement-breakpoint
ALTER TABLE "homes" ADD COLUMN "floor_label" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "username" "citext";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "mobile" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "email" "citext";--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "floor_id" uuid;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "length_ft" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "width_ft" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "level" "task_level" DEFAULT 'task' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "task_type" "task_type" DEFAULT 'plain' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "planned_start" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "planned_end" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "actual_start" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "actual_end" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "expected_cost" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "actual_cost" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "manual_progress" smallint;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_item_materials" ADD CONSTRAINT "line_item_materials_line_item_id_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_progress" ADD CONSTRAINT "space_progress_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_progress" ADD CONSTRAINT "space_progress_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_line_item_id_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_contacts" ADD CONSTRAINT "task_contacts_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_selections" ADD CONSTRAINT "task_selections_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_selections" ADD CONSTRAINT "task_selections_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "floors_home_id_idx" ON "floors" USING btree ("home_id");--> statement-breakpoint
CREATE INDEX "line_item_materials_line_item_id_idx" ON "line_item_materials" USING btree ("line_item_id");--> statement-breakpoint
CREATE INDEX "line_items_task_id_idx" ON "line_items" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "line_items_floor_id_idx" ON "line_items" USING btree ("floor_id");--> statement-breakpoint
CREATE INDEX "line_items_room_id_idx" ON "line_items" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "line_items_planned_end_idx" ON "line_items" USING btree ("planned_end");--> statement-breakpoint
CREATE INDEX "payments_task_id_idx" ON "payments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "payments_paid_on_idx" ON "payments" USING btree ("paid_on");--> statement-breakpoint
CREATE UNIQUE INDEX "space_progress_task_room_uidx" ON "space_progress" USING btree ("task_id","room_id");--> statement-breakpoint
CREATE INDEX "space_progress_room_id_idx" ON "space_progress" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "stages_task_id_idx" ON "stages" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "stages_line_item_id_idx" ON "stages" USING btree ("line_item_id");--> statement-breakpoint
CREATE INDEX "stages_planned_end_idx" ON "stages" USING btree ("planned_end");--> statement-breakpoint
CREATE INDEX "task_contacts_task_id_idx" ON "task_contacts" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_selections_task_id_idx" ON "task_selections" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_selections_room_id_idx" ON "task_selections" USING btree ("room_id");--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_line_item_id_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."line_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_line_item_id_idx" ON "attachments" USING btree ("line_item_id");--> statement-breakpoint
CREATE INDEX "attachments_stage_id_idx" ON "attachments" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "rooms_floor_id_idx" ON "rooms" USING btree ("floor_id");--> statement-breakpoint
CREATE INDEX "tasks_planned_start_idx" ON "tasks" USING btree ("planned_start");--> statement-breakpoint
CREATE INDEX "tasks_planned_end_idx" ON "tasks" USING btree ("planned_end");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_mobile_unique" UNIQUE("mobile");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_manual_progress_range" CHECK ("tasks"."manual_progress" is null or "tasks"."manual_progress" between 0 and 100);--> statement-breakpoint
CREATE POLICY "app_settings_select_members" ON "app_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member("app_settings"."home_id"));--> statement-breakpoint
CREATE POLICY "app_settings_insert_editors" ON "app_settings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home("app_settings"."home_id"));--> statement-breakpoint
CREATE POLICY "app_settings_update_editors" ON "app_settings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home("app_settings"."home_id")) WITH CHECK (public.can_edit_home("app_settings"."home_id"));--> statement-breakpoint
CREATE POLICY "app_settings_delete_editors" ON "app_settings" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home("app_settings"."home_id"));--> statement-breakpoint
CREATE POLICY "floors_select_members" ON "floors" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member("floors"."home_id"));--> statement-breakpoint
CREATE POLICY "floors_insert_editors" ON "floors" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home("floors"."home_id"));--> statement-breakpoint
CREATE POLICY "floors_update_editors" ON "floors" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home("floors"."home_id")) WITH CHECK (public.can_edit_home("floors"."home_id"));--> statement-breakpoint
CREATE POLICY "floors_delete_editors" ON "floors" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home("floors"."home_id"));--> statement-breakpoint
CREATE POLICY "line_item_materials_select_members" ON "line_item_materials" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member(public.line_item_home_id("line_item_materials"."line_item_id")));--> statement-breakpoint
CREATE POLICY "line_item_materials_insert_editors" ON "line_item_materials" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home(public.line_item_home_id("line_item_materials"."line_item_id")));--> statement-breakpoint
CREATE POLICY "line_item_materials_update_editors" ON "line_item_materials" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home(public.line_item_home_id("line_item_materials"."line_item_id"))) WITH CHECK (public.can_edit_home(public.line_item_home_id("line_item_materials"."line_item_id")));--> statement-breakpoint
CREATE POLICY "line_item_materials_delete_editors" ON "line_item_materials" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home(public.line_item_home_id("line_item_materials"."line_item_id")));--> statement-breakpoint
CREATE POLICY "line_items_select_members" ON "line_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member(public.task_home_id("line_items"."task_id")));--> statement-breakpoint
CREATE POLICY "line_items_insert_editors" ON "line_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home(public.task_home_id("line_items"."task_id")));--> statement-breakpoint
CREATE POLICY "line_items_update_editors" ON "line_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home(public.task_home_id("line_items"."task_id"))) WITH CHECK (public.can_edit_home(public.task_home_id("line_items"."task_id")));--> statement-breakpoint
CREATE POLICY "line_items_delete_editors" ON "line_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home(public.task_home_id("line_items"."task_id")));--> statement-breakpoint
CREATE POLICY "payments_select_members" ON "payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member(public.task_home_id("payments"."task_id")));--> statement-breakpoint
CREATE POLICY "payments_insert_editors" ON "payments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home(public.task_home_id("payments"."task_id")));--> statement-breakpoint
CREATE POLICY "payments_update_editors" ON "payments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home(public.task_home_id("payments"."task_id"))) WITH CHECK (public.can_edit_home(public.task_home_id("payments"."task_id")));--> statement-breakpoint
CREATE POLICY "payments_delete_editors" ON "payments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home(public.task_home_id("payments"."task_id")));--> statement-breakpoint
CREATE POLICY "space_progress_select_members" ON "space_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member(public.task_home_id("space_progress"."task_id")));--> statement-breakpoint
CREATE POLICY "space_progress_insert_editors" ON "space_progress" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home(public.task_home_id("space_progress"."task_id")));--> statement-breakpoint
CREATE POLICY "space_progress_update_editors" ON "space_progress" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home(public.task_home_id("space_progress"."task_id"))) WITH CHECK (public.can_edit_home(public.task_home_id("space_progress"."task_id")));--> statement-breakpoint
CREATE POLICY "space_progress_delete_editors" ON "space_progress" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home(public.task_home_id("space_progress"."task_id")));--> statement-breakpoint
CREATE POLICY "stages_select_members" ON "stages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member(coalesce(public.task_home_id("stages"."task_id"), public.line_item_home_id("stages"."line_item_id"))));--> statement-breakpoint
CREATE POLICY "stages_insert_editors" ON "stages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home(coalesce(public.task_home_id("stages"."task_id"), public.line_item_home_id("stages"."line_item_id"))));--> statement-breakpoint
CREATE POLICY "stages_update_editors" ON "stages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home(coalesce(public.task_home_id("stages"."task_id"), public.line_item_home_id("stages"."line_item_id")))) WITH CHECK (public.can_edit_home(coalesce(public.task_home_id("stages"."task_id"), public.line_item_home_id("stages"."line_item_id"))));--> statement-breakpoint
CREATE POLICY "stages_delete_editors" ON "stages" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home(coalesce(public.task_home_id("stages"."task_id"), public.line_item_home_id("stages"."line_item_id"))));--> statement-breakpoint
CREATE POLICY "task_contacts_select_members" ON "task_contacts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member(public.task_home_id("task_contacts"."task_id")));--> statement-breakpoint
CREATE POLICY "task_contacts_insert_editors" ON "task_contacts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home(public.task_home_id("task_contacts"."task_id")));--> statement-breakpoint
CREATE POLICY "task_contacts_update_editors" ON "task_contacts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home(public.task_home_id("task_contacts"."task_id"))) WITH CHECK (public.can_edit_home(public.task_home_id("task_contacts"."task_id")));--> statement-breakpoint
CREATE POLICY "task_contacts_delete_editors" ON "task_contacts" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home(public.task_home_id("task_contacts"."task_id")));--> statement-breakpoint
CREATE POLICY "task_selections_select_members" ON "task_selections" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member(public.task_home_id("task_selections"."task_id")));--> statement-breakpoint
CREATE POLICY "task_selections_insert_editors" ON "task_selections" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home(public.task_home_id("task_selections"."task_id")));--> statement-breakpoint
CREATE POLICY "task_selections_update_editors" ON "task_selections" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home(public.task_home_id("task_selections"."task_id"))) WITH CHECK (public.can_edit_home(public.task_home_id("task_selections"."task_id")));--> statement-breakpoint
CREATE POLICY "task_selections_delete_editors" ON "task_selections" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home(public.task_home_id("task_selections"."task_id")));