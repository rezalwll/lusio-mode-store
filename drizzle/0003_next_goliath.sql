CREATE TABLE "admin_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_admin_id" uuid,
	"actor_email" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"correlation_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbound_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" integer,
	"phone" text NOT NULL,
	"message_type" text NOT NULL,
	"template_key" text NOT NULL,
	"provider_key" text NOT NULL,
	"provider_message_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbound_messages_status_valid" CHECK ("outbound_messages"."status" IN ('queued', 'sent', 'failed', 'delivered')),
	CONSTRAINT "outbound_messages_attempts_non_negative" CHECK ("outbound_messages"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"provider_key" text NOT NULL,
	"amount_rial" bigint NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"idempotency_key" text NOT NULL,
	"provider_authority" text,
	"provider_transaction_id" text,
	"callback_token_hash" text NOT NULL,
	"failure_code" text,
	"failure_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	CONSTRAINT "payment_attempts_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "payment_attempts_callback_token_hash_unique" UNIQUE("callback_token_hash"),
	CONSTRAINT "payment_attempts_status_valid" CHECK ("payment_attempts"."status" IN ('created', 'awaiting_user', 'verifying', 'paid', 'failed', 'cancelled', 'expired')),
	CONSTRAINT "payment_attempts_amount_positive" CHECK ("payment_attempts"."amount_rial" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_attempt_id" uuid,
	"order_id" text,
	"provider_key" text NOT NULL,
	"event_type" text NOT NULL,
	"deduplication_key" text NOT NULL,
	"provider_event_id" text,
	"correlation_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_events_deduplication_key_unique" UNIQUE("deduplication_key")
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_buckets_count_non_negative" CHECK ("rate_limit_buckets"."count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_admin_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_attempt_id_payment_attempts_id_fk" FOREIGN KEY ("payment_attempt_id") REFERENCES "public"."payment_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_logs_created" ON "admin_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_actor_created" ON "admin_audit_logs" USING btree ("actor_admin_id","created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_entity_created" ON "admin_audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "outbound_messages_phone_created" ON "outbound_messages" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "outbound_messages_status_updated" ON "outbound_messages" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "payment_attempts_order_created" ON "payment_attempts" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_attempts_provider_authority" ON "payment_attempts" USING btree ("provider_key","provider_authority");--> statement-breakpoint
CREATE INDEX "payment_attempts_status_updated" ON "payment_attempts" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "payment_events_attempt_created" ON "payment_events" USING btree ("payment_attempt_id","created_at");--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_reset" ON "rate_limit_buckets" USING btree ("reset_at");