# Production runbook

## Runtime configuration

Start from `.env.example`; never commit real credentials. The server validates configuration lazily so `next build` does not require deployment secrets, while runtime and `/api/health/ready` fail clearly on invalid values.

- Core: `DATABASE_URL`, `APP_ORIGIN`, and `SESSION_COOKIE_SECURE=true` for an HTTPS origin.
- Proxy: keep `TRUST_PROXY_HEADERS=false` when Next is directly internet-facing. Set it to `true` only when a trusted reverse proxy replaces `X-Forwarded-For`/`X-Real-IP`. The first syntactically valid forwarded address becomes the rate-limit/audit source.
- Payment: keep `PAYMENT_PROVIDER=none` until a real adapter exists. This mode can create pending orders but cannot start, verify, or fake a successful payment.
- Reservation: `ORDER_PAYMENT_RESERVATION_MINUTES` controls how long an unpaid order holds inventory and coupon capacity. It must be an integer from 5 to 180; the default is 30 minutes.
- Messaging: production must use `MESSAGE_PROVIDER=webhook`, `none`, or a future real adapter. `development` is rejected in production. Webhook mode requires `MESSAGE_WEBHOOK_URL`, `MESSAGE_WEBHOOK_TOKEN`, and an `OTP_HASH_SECRET` of at least 32 characters. There is no production fallback to console OTP.
- Media: `MEDIA_STORAGE_DRIVER=s3` requires all relevant `S3_*` variables. Local storage is suitable only for development/single writable instances.
- Set `ENABLE_HSTS=true` only after HTTPS is permanent for the domain and subdomains.
- `ADMIN_BOOTSTRAP_*` is consumed only by the explicit owner bootstrap shared by `admin:bootstrap` and `db:seed`. Remove those values immediately after the initial owner is created.

The generic message webhook receives provider-neutral JSON. An HTTP 2xx is recorded as `sent`, never `delivered`; a future delivery receipt must explicitly establish delivery.

## Preflight and first owner

Run `npm run env:check` in the release environment before migration or traffic shift. It validates syntax, provider selection, cookie policy, reservation TTL, and required S3/message settings without connecting to PostgreSQL or calling payment, SMS, or object-storage providers. Success output contains only provider names and non-secret operational values; failure exits nonzero and never prints configured secret values. Database connectivity is checked separately by `/api/health/ready`.

Create the first owner once, after migrations, with credentials injected by the deployment secret manager:

```bash
ADMIN_BOOTSTRAP_EMAIL=owner@example.com \
ADMIN_BOOTSTRAP_PASSWORD='a-unique-long-random-password' \
ADMIN_BOOTSTRAP_NAME='Store owner' \
npm run admin:bootstrap
```

The command requires both email and password, enforces the admin password policy, and uses a database lock. It creates one owner only when no owner or administrator exists; otherwise it refuses without changing any account or password. Remove all `ADMIN_BOOTSTRAP_*` secrets from the runtime environment after success. There is no default production credential. `db:seed` uses the same guarded operation only when these variables are explicitly present.

## Container and process contract

The multi-stage `Dockerfile` provides two release targets from Node 24:

- `web` (the default target) contains only the standalone Next runtime and static/public assets, runs as the non-root `nextjs` user, listens on port `8080`, and probes `/api/health/live`.
- `operations` contains the release source and locked Node dependencies, runs as the non-root `node` user, and is for one-shot migrations/bootstrap and the external scheduler. It is not a public web service.

Build both immutable images from the same commit:

```bash
docker build --target web -t registry.example/lusio-web:RELEASE_SHA .
docker build --target operations -t registry.example/lusio-operations:RELEASE_SHA .
```

The vendor-neutral production topology is:

- **WEB:** one or more `web` containers, port `8080`, behind an HTTPS reverse proxy/load balancer. Liveness is `GET /api/health/live`; readiness is `GET /api/health/ready`.
- **DATABASE:** external PostgreSQL reached through `DATABASE_URL`. PostgreSQL is not bundled in either application image.
- **CRON:** an external scheduler starts `operations npm run maintenance` about every five minutes. Cron never runs inside a web container.
- **OBJECT STORAGE:** an external S3-compatible service with `MEDIA_STORAGE_DRIVER=s3`. Local uploads are development-only and are not durable or shared across replicas.

Inject environment variables at container start, never at image build. At minimum, production needs `DATABASE_URL`, `APP_ORIGIN`, `SESSION_COOKIE_SECURE=true`, `PAYMENT_PROVIDER=none`, a non-development `MESSAGE_PROVIDER`, and `MEDIA_STORAGE_DRIVER=s3` plus its `S3_*` settings. Configure proxy flags, HSTS, OTP hash secret, and provider webhook values according to the runtime configuration section above.

Run migrations exactly once before shifting traffic, not in every web replica:

```bash
docker run --rm --env-file /secure/runtime.env registry.example/lusio-operations:RELEASE_SHA npm run env:check
docker run --rm --env-file /secure/runtime.env registry.example/lusio-operations:RELEASE_SHA npm run db:migrate
docker run -d --env-file /secure/runtime.env -p 8080:8080 registry.example/lusio-web:RELEASE_SHA
```

For a non-container deployment, the equivalent release sequence is `npm ci`, `npm run env:check`, `npm run db:migrate`, then `npm run start`. The scheduler runs `npm run maintenance` independently from the same release. Persist PostgreSQL and S3 data externally; application containers are disposable.

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

Run `npm run maintenance` more frequently than the reservation TTL—recommended every 5 minutes for the default 30-minute TTL—with `DATABASE_URL` and the normal runtime provider configuration. A PostgreSQL advisory lock makes overlapping invocations exit safely. A real failure exits nonzero and emits a structured `maintenance.failed` event. This job is mandatory: without it, abandoned unpaid orders would keep inventory and coupon capacity reserved.

Order creation immediately decrements product/variant stock and reserves coupon usage while payment remains pending. Each maintenance run first invokes payment reconciliation, then locks and cancels expired unpaid reservations through the same release service used by admin cancellation. A provider without inquiry support reports a safe skip. Release restores product and variant stock, releases reserved coupon usage exactly once, preserves order/payment history, and closes active payment attempts. It then performs transient cleanup:

- deletes expired admin/customer sessions;
- deletes OTP challenges expired or consumed for more than 24 hours;
- deletes expired shared rate-limit buckets;

Paid orders are never released. If a provider later proves money was captured after an expired reservation was already released, financial truth is retained (`paymentStatus=paid`) while fulfillment stays cancelled; `paymentReviewRequired` is raised for manual refund/resolution and stock or coupon usage is not consumed again.

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

## Legacy and demo runtime audit

- Browser persistence is limited to validated cart identifiers/quantities and an entered coupon code. Products, inventory, customers, orders, settings, administrators, sessions, and audit records are PostgreSQL-owned.
- `assets/data` catalog JSON is an import/seed source and test oracle only; active storefront queries have no static JSON fallback.
- The old root HTML files and `assets/js/app.js` are retained migration references and are not served by the Next application. Their historical local-cart/mock-checkout code is not in the production route graph.
- There are no hardcoded production admin credentials. `.env.example` values are development placeholders, and the bootstrap password policy rejects the documented placeholder.
- `PAYMENT_PROVIDER=none` fails closed and cannot report payment success. No fake paid path is active.
- Development OTP logging exists only for local development and is rejected when `NODE_ENV=production`; production has no console-OTP fallback.
- No mock/random analytics implementation is active. Random UUIDs are used only for identifiers/correlation data.

## Final internal readiness checklist

Before first deploy:

- [ ] External PostgreSQL is ready and backed up.
- [ ] Production environment passes `npm run env:check`.
- [ ] Migrations ran once from the release operations image.
- [ ] Initial owner was created with `npm run admin:bootstrap`, then bootstrap secrets were removed.
- [ ] External S3-compatible storage is configured and upload/read behavior is verified.
- [ ] HTTPS and the trusted reverse-proxy policy are configured.
- [ ] External maintenance cron runs about every five minutes.
- [ ] Database and object-storage backups, retention, and restore drills are configured.
- [ ] Liveness and readiness endpoints are configured in the orchestrator.

Before external integrations:

- [ ] Payment remains `PAYMENT_PROVIDER=none`.
- [ ] Messaging remains `none`/`disabled`, a reviewed generic webhook, or local-only `development` according to environment.
- [ ] No fake payment success or production OTP disclosure path exists.

After vendors are chosen:

- [ ] Implement the payment adapter and SMS adapter against their existing internal interfaces.
- [ ] Set provider credentials, callback secrets, and message template IDs through the secret manager.
- [ ] Verify success, failure, retries, idempotency, callbacks, and receipts in vendor sandboxes.
- [ ] Switch production provider configuration only after sandbox and operational review pass.
