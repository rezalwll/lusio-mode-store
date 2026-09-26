# Production runbook

## Runtime configuration

Start from `.env.example`; never commit real credentials. The server validates configuration lazily so `next build` does not require deployment secrets, while runtime and `/api/health/ready` fail clearly on invalid values.

- Core: `DATABASE_URL`, `APP_ORIGIN`, and `SESSION_COOKIE_SECURE=true` for an HTTPS origin.
- Proxy: keep `TRUST_PROXY_HEADERS=false` when Next is directly internet-facing. Set it to `true` only when a trusted reverse proxy replaces `X-Forwarded-For`/`X-Real-IP`. The first syntactically valid forwarded address becomes the rate-limit/audit source.
- Payment: keep `PAYMENT_PROVIDER=none` until a real adapter exists. This mode can create pending orders but cannot start, verify, or fake a successful payment.
- Messaging: production must use `MESSAGE_PROVIDER=webhook`, `none`, or a future real adapter. `development` is rejected in production. Webhook mode requires `MESSAGE_WEBHOOK_URL`, `MESSAGE_WEBHOOK_TOKEN`, and an `OTP_HASH_SECRET` of at least 32 characters. There is no production fallback to console OTP.
- Media: `MEDIA_STORAGE_DRIVER=s3` requires all relevant `S3_*` variables. Local storage is suitable only for development/single writable instances.
- Set `ENABLE_HSTS=true` only after HTTPS is permanent for the domain and subdomains.
- `ADMIN_BOOTSTRAP_*` is seed-only. Remove those values after the initial administrator is created.

The generic message webhook receives provider-neutral JSON. An HTTP 2xx is recorded as `sent`, never `delivered`; a future delivery receipt must explicitly establish delivery.

## Release and migration sequence

Use additive/backward-compatible migrations whenever possible. Review generated SQL and create a verified backup before applying it. A safe sequence is:

1. Build and validate the release (`npm ci`, lint, typecheck, tests, `db:check`, build).
2. Put a recent database backup in durable object storage.
3. Apply migrations with `npm run db:migrate`; never use schema push in production.
4. Start the new application while traffic remains on the previous healthy release.
5. Wait for `GET /api/health/live` (process alive) and `GET /api/health/ready` (configuration valid and PostgreSQL reachable) to return HTTP 200.
6. Shift traffic to the new release and monitor structured JSON logs.
7. Run `npm run maintenance` separately from application startup.

`db:seed` is idempotent for base data but is not a migration mechanism. Run it only when the release requires seed reconciliation.

## Health checks and reverse proxy

- `/api/health/live` has no external dependency and returns `{ "status": "ok" }`.
- `/api/health/ready` validates runtime configuration and performs a fast PostgreSQL `select 1`; it returns 503 without secrets when unavailable.
- Neither endpoint checks optional payment/SMS vendors or performs S3 object operations.
- Configure container liveness against `live` and rollout/readiness against `ready`. Do not expose stack traces from proxy error pages.
- The proxy should terminate HTTPS, enforce upload/body limits, set `Host`, and replace forwarded-address headers. Security headers are emitted by Next; HSTS remains explicitly opt-in.

## Maintenance and retention

Run `npm run maintenance` every 10–15 minutes with `DATABASE_URL` and the normal runtime provider configuration. A PostgreSQL advisory lock makes overlapping invocations exit safely. A real failure exits nonzero and emits a structured `maintenance.failed` event.

Each run first invokes payment reconciliation. A provider without inquiry support reports a safe skip. It then:

- deletes expired admin/customer sessions;
- deletes OTP challenges expired or consumed for more than 24 hours;
- deletes expired shared rate-limit buckets;
- marks unverified payment attempts stale for more than 24 hours as `expired`.

Orders, order items, coupon redemptions, payment attempts/events, outbound message history, and admin audit logs are durable and are not deleted by this job. Any later archival policy must be explicit; this document makes no legal retention promise.

## PostgreSQL backup and restore

Create a custom-format backup before every migration (replace placeholders through a secret manager):

```bash
pg_dump --format=custom --no-owner --no-acl --file=lusio-$(date +%F-%H%M).dump "$DATABASE_URL"
```

Upload backups to encrypted object storage with versioning, access controls, retention/lifecycle rules, and a copy outside the primary failure domain. Back up media objects independently.

Restore into a new empty verification database, not over the live database:

```bash
createdb lusio_restore_check
pg_restore --exit-on-error --clean --if-exists --no-owner --dbname=lusio_restore_check lusio-YYYY-MM-DD-HHMM.dump
```

Run migrations/checks against the restored database, compare critical row counts, sample recent orders/payment events, and perform an application smoke test. For rollback, prefer a reviewed forward fix. If a migration is destructive or incompatible, remove traffic, restore the verified database backup and matching application artifact, then re-check readiness before restoring traffic. Do not improvise automatic down migrations.

## Final payment adapter checklist

When a gateway is chosen, add one `PaymentProvider` adapter and registry/config entry:

- document merchant credentials, sandbox/production base URLs, callback URL and secret variables;
- map create-payment request, authority/session and redirect URL;
- authenticate callback data, then call the provider verify API rather than trusting query parameters;
- map verified amount, transaction/reference ID and provider states to internal states;
- implement `queryPayment` for reconciliation when supported;
- document retry/idempotency semantics and callback event identity;
- add refund support only when the provider contract and business workflow are defined;
- test amount mismatch, duplicate callbacks, unavailable provider and sandbox success/failure.

No real payment gateway is currently connected. `PAYMENT_PROVIDER=none` is deliberately fail-closed.

## Final SMS adapter checklist

When an SMS vendor is chosen, add one `MessageProvider` adapter and registry/config entry:

- define credential, API URL, sender/originator and sandbox/production variables;
- map OTP and transactional template IDs (`order_created`, `order_status_changed`, `order_shipped`);
- normalize vendor accepted/rejected results and provider message IDs;
- map retryable/non-retryable API errors without logging credentials or OTP values;
- implement delivery-receipt verification before introducing `delivered` status;
- verify production never falls back to console OTP and optional order notifications never fail order processing.

No real SMS vendor is currently connected. `MESSAGE_PROVIDER=none` fails OTP cleanly; `development` is local-only.

## Operational rollback and incident notes

Structured logs include event names and correlation IDs for payment, media, checkout, messaging, health, and maintenance paths. Admin activity records identify actor, action, entity, source and correlation ID without passwords, session tokens, OTP values, or provider secrets. During an incident, use the correlation ID to join application logs with payment events and admin activity.
