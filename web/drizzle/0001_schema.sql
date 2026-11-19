CREATE TYPE "public"."attachment_type" AS ENUM('image', 'pdf', 'document');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."paint_finish" AS ENUM('matte', 'satin', 'gloss');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'done', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('contacted', 'quote_received', 'appointed');--> statement-breakpoint
CREATE TYPE "public"."vendor_trade" AS ENUM('painter', 'carpenter', 'electrician', 'plumber', 'mover', 'other');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"task_id" uuid,
	"room_id" uuid,
	"type" "attachment_type" NOT NULL,
	"storage_path" text NOT NULL,
	"file_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "home_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "home_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "homes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"bhk" text,
	"possession_date" date,
	"move_in_date" date,
	"total_budget" numeric(14, 2),
	"currency" text DEFAULT 'INR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "homes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'ListChecks' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"budget" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "modules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"duration_days" integer,
	"includes" text,
	"is_accepted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"name" text NOT NULL,
	"area_sqft" numeric(10, 2),
	"plan_x" numeric,
	"plan_y" numeric,
	"plan_w" numeric,
	"plan_h" numeric,
	"wall_color_hex" text,
	"wall_color_name" text,
	"finish" "paint_finish",
	"ceiling_color_hex" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "task_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"parent_task_id" uuid,
	"title" text NOT NULL,
	"notes" text,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"due_date" date,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"cost_estimate" numeric(14, 2),
	"cost_actual" numeric(14, 2),
	"vendor_id" uuid,
	"is_custom" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"name" text NOT NULL,
	"trade" "vendor_trade" NOT NULL,
	"phone" text,
	"rating" smallint,
	"notes" text,
	"status" "vendor_status" DEFAULT 'contacted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_members" ADD CONSTRAINT "home_members_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_members" ADD CONSTRAINT "home_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homes" ADD CONSTRAINT "homes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_rooms" ADD CONSTRAINT "task_rooms_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_rooms" ADD CONSTRAINT "task_rooms_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_home_id_idx" ON "attachments" USING btree ("home_id");--> statement-breakpoint
CREATE INDEX "attachments_task_id_idx" ON "attachments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "attachments_room_id_idx" ON "attachments" USING btree ("room_id");--> statement-breakpoint
CREATE UNIQUE INDEX "home_members_home_user_uidx" ON "home_members" USING btree ("home_id","user_id");--> statement-breakpoint
CREATE INDEX "home_members_user_id_idx" ON "home_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "homes_owner_id_idx" ON "homes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "modules_home_id_idx" ON "modules" USING btree ("home_id");--> statement-breakpoint
CREATE INDEX "quotes_task_id_idx" ON "quotes" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "quotes_vendor_id_idx" ON "quotes" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "rooms_home_id_idx" ON "rooms" USING btree ("home_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_rooms_task_room_uidx" ON "task_rooms" USING btree ("task_id","room_id");--> statement-breakpoint
CREATE INDEX "task_rooms_room_id_idx" ON "task_rooms" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "tasks_module_id_idx" ON "tasks" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "tasks_parent_task_id_idx" ON "tasks" USING btree ("parent_task_id");--> statement-breakpoint
CREATE INDEX "tasks_vendor_id_idx" ON "tasks" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "templates_owner_id_idx" ON "templates" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "vendors_home_id_idx" ON "vendors" USING btree ("home_id");--> statement-breakpoint
CREATE POLICY "attachments_select_members" ON "attachments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member("attachments"."home_id"));--> statement-breakpoint
CREATE POLICY "attachments_insert_editors" ON "attachments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home("attachments"."home_id"));--> statement-breakpoint
CREATE POLICY "attachments_update_editors" ON "attachments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home("attachments"."home_id")) WITH CHECK (public.can_edit_home("attachments"."home_id"));--> statement-breakpoint
CREATE POLICY "attachments_delete_editors" ON "attachments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home("attachments"."home_id"));--> statement-breakpoint
CREATE POLICY "home_members_select_members" ON "home_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member("home_members"."home_id"));--> statement-breakpoint
CREATE POLICY "home_members_insert_owner" ON "home_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.is_home_owner("home_members"."home_id"));--> statement-breakpoint
CREATE POLICY "home_members_update_owner" ON "home_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.is_home_owner("home_members"."home_id")) WITH CHECK (public.is_home_owner("home_members"."home_id"));--> statement-breakpoint
CREATE POLICY "home_members_delete_owner" ON "home_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.is_home_owner("home_members"."home_id"));--> statement-breakpoint
CREATE POLICY "homes_select_members" ON "homes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("homes"."owner_id" = (select auth.uid()) or public.is_home_member("homes"."id"));--> statement-breakpoint
CREATE POLICY "homes_insert_self_owner" ON "homes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("homes"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "homes_update_editors" ON "homes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home("homes"."id")) WITH CHECK (public.can_edit_home("homes"."id"));--> statement-breakpoint
CREATE POLICY "homes_delete_owner" ON "homes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("homes"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "modules_select_members" ON "modules" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member("modules"."home_id"));--> statement-breakpoint
CREATE POLICY "modules_insert_editors" ON "modules" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home("modules"."home_id"));--> statement-breakpoint
CREATE POLICY "modules_update_editors" ON "modules" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home("modules"."home_id")) WITH CHECK (public.can_edit_home("modules"."home_id"));--> statement-breakpoint
CREATE POLICY "modules_delete_editors" ON "modules" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home("modules"."home_id"));--> statement-breakpoint
CREATE POLICY "profiles_select_own" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("profiles"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_insert_own" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("profiles"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profiles"."user_id" = (select auth.uid())) WITH CHECK ("profiles"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "quotes_select_members" ON "quotes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member(public.task_home_id("quotes"."task_id")));--> statement-breakpoint
CREATE POLICY "quotes_insert_editors" ON "quotes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home(public.task_home_id("quotes"."task_id")));--> statement-breakpoint
CREATE POLICY "quotes_update_editors" ON "quotes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home(public.task_home_id("quotes"."task_id"))) WITH CHECK (public.can_edit_home(public.task_home_id("quotes"."task_id")));--> statement-breakpoint
CREATE POLICY "quotes_delete_editors" ON "quotes" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home(public.task_home_id("quotes"."task_id")));--> statement-breakpoint
CREATE POLICY "rooms_select_members" ON "rooms" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member("rooms"."home_id"));--> statement-breakpoint
CREATE POLICY "rooms_insert_editors" ON "rooms" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home("rooms"."home_id"));--> statement-breakpoint
CREATE POLICY "rooms_update_editors" ON "rooms" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home("rooms"."home_id")) WITH CHECK (public.can_edit_home("rooms"."home_id"));--> statement-breakpoint
CREATE POLICY "rooms_delete_editors" ON "rooms" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home("rooms"."home_id"));--> statement-breakpoint
CREATE POLICY "task_rooms_select_members" ON "task_rooms" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member(public.task_home_id("task_rooms"."task_id")));--> statement-breakpoint
CREATE POLICY "task_rooms_insert_editors" ON "task_rooms" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home(public.task_home_id("task_rooms"."task_id")));--> statement-breakpoint
CREATE POLICY "task_rooms_update_editors" ON "task_rooms" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home(public.task_home_id("task_rooms"."task_id"))) WITH CHECK (public.can_edit_home(public.task_home_id("task_rooms"."task_id")));--> statement-breakpoint
CREATE POLICY "task_rooms_delete_editors" ON "task_rooms" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home(public.task_home_id("task_rooms"."task_id")));--> statement-breakpoint
CREATE POLICY "tasks_select_members" ON "tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member(public.module_home_id("tasks"."module_id")));--> statement-breakpoint
CREATE POLICY "tasks_insert_editors" ON "tasks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home(public.module_home_id("tasks"."module_id")));--> statement-breakpoint
CREATE POLICY "tasks_update_editors" ON "tasks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home(public.module_home_id("tasks"."module_id"))) WITH CHECK (public.can_edit_home(public.module_home_id("tasks"."module_id")));--> statement-breakpoint
CREATE POLICY "tasks_delete_editors" ON "tasks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home(public.module_home_id("tasks"."module_id")));--> statement-breakpoint
CREATE POLICY "templates_all_own" ON "templates" AS PERMISSIVE FOR ALL TO "authenticated" USING ("templates"."owner_id" = (select auth.uid())) WITH CHECK ("templates"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "vendors_select_members" ON "vendors" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_home_member("vendors"."home_id"));--> statement-breakpoint
CREATE POLICY "vendors_insert_editors" ON "vendors" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.can_edit_home("vendors"."home_id"));--> statement-breakpoint
CREATE POLICY "vendors_update_editors" ON "vendors" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.can_edit_home("vendors"."home_id")) WITH CHECK (public.can_edit_home("vendors"."home_id"));--> statement-breakpoint
CREATE POLICY "vendors_delete_editors" ON "vendors" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.can_edit_home("vendors"."home_id"));