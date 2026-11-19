DROP INDEX "tasks_due_date_idx";--> statement-breakpoint
ALTER TABLE "homes" ALTER COLUMN "address" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "floor_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "due_date";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "cost_estimate";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "cost_actual";