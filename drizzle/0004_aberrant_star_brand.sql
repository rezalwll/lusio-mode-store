ALTER TABLE "coupon_redemptions" ADD COLUMN "status" text DEFAULT 'reserved' NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD COLUMN "released_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reservation_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "inventory_released_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_review_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_review_reason" text;--> statement-breakpoint
UPDATE "orders" SET
  "reservation_expires_at" = "created_at" + interval '30 minutes',
  "inventory_released_at" = CASE WHEN "status" = 'cancelled' THEN "updated_at" ELSE NULL END,
  "cancelled_at" = CASE WHEN "status" = 'cancelled' THEN "updated_at" ELSE NULL END,
  "cancellation_reason" = CASE WHEN "status" = 'cancelled' THEN 'legacy_cancelled' ELSE NULL END,
  "payment_review_required" = CASE WHEN "status" = 'cancelled' AND "payment_status" = 'paid' THEN true ELSE false END,
  "payment_review_reason" = CASE WHEN "status" = 'cancelled' AND "payment_status" = 'paid' THEN 'legacy paid order was already cancelled' ELSE NULL END;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "reservation_expires_at" SET NOT NULL;--> statement-breakpoint
UPDATE "coupon_redemptions" AS cr SET
  "status" = CASE WHEN o."payment_status" = 'paid' THEN 'consumed' WHEN o."status" = 'cancelled' THEN 'released' ELSE 'reserved' END,
  "released_at" = CASE WHEN o."payment_status" <> 'paid' AND o."status" = 'cancelled' THEN o."updated_at" ELSE NULL END
FROM "orders" AS o WHERE o."id" = cr."order_id";--> statement-breakpoint
UPDATE "coupons" AS c SET "used_count" = (
  SELECT count(*)::integer FROM "coupon_redemptions" AS cr WHERE cr."coupon_id" = c."id" AND cr."status" <> 'released'
);--> statement-breakpoint
CREATE INDEX "orders_reservation_expiry" ON "orders" USING btree ("reservation_expires_at");--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_status_valid" CHECK ("coupon_redemptions"."status" IN ('reserved', 'consumed', 'released'));
