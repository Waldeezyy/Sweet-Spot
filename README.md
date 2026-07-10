# B's Sweet Spot

Custom bakery website for **B's Sweet Spot** — made-to-order cakes and treats in Dimondale, Michigan.

Customers browse the menu, check out online, request fully custom quotes, and track orders. Brandy manages menu, orders, quotes, schedule, and shop settings from a private admin dashboard.

## Stack

- **Next.js 15** (App Router) + **React 19** + TypeScript + Tailwind CSS
- **PostgreSQL** via Prisma
- **NextAuth** (email + password for admin)
- **Square** (Payment Links + webhooks)
- **Resend** (transactional email)
- **Railway** (hosting, Postgres, optional upload volume)
- **Node.js 20+** (required for `sharp` image processing)

## Features

### Customer storefront

| Area | Routes | Notes |
|------|--------|-------|
| Homepage | `/` | Hero pathway cards, gallery carousel, featured items, reviews |
| Menu | `/menu`, `/menu/[slug]` | Browse categories, customize options, add to cart |
| Checkout | `/order` | Multi-step cart checkout with pickup/delivery and scheduling |
| Custom quotes | `/custom-order` | Fully custom requests (not on the menu) |
| Order tracking | `/order/track`, `/order/status/[token]` | Lookup by order number + email |
| Gallery, reviews, about, contact | `/gallery`, `/reviews`, `/about`, `/contact` | |

### Order pathways

```text
Menu path:     /menu → cart → /order checkout → Square payment
Custom path:   /custom-order → Brandy quotes → customer pays via emailed link
```

**Standard menu items** — pay deposit or full amount at checkout (configurable in shop settings).

**Semi-custom menu items** (marked with a **Custom** badge) — submitted without payment; Brandy sets the final price and emails a pay link.

**Rush orders** (pickup/delivery inside the standard lead-time window) — $15 rush fee; request submitted for approval first, then customer pays after approval.

### Admin dashboard

Visit `/admin/login` (not linked in the public header). Sign in with `ADMIN_EMAIL` + `ADMIN_PASSWORD`.

- **Dashboard** — active orders, items needing price review, custom requests, upcoming schedule
- **My Menu** — products, categories, flavors, add-ons, and menu options
- **My Photos** — gallery uploads (stored on disk; use a Railway volume in production)
- **Orders** — view orders, approve/decline rush and semi-custom quotes, update status
- **Custom Requests** — quote fully custom orders and send pay links
- **My Schedule** — block unavailable dates
- **Shop Settings** — policies, lead time, deposit %, contact email, delivery options

## Local development

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database:

   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

Admin login uses the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from your `.env`.

## Railway deployment

1. Create a Railway project and connect the GitHub repo [`Waldeezyy/Sweet-Spot`](https://github.com/Waldeezyy/Sweet-Spot).
2. **Add PostgreSQL** (required):
   - **+ New** → **Database** → **PostgreSQL**
   - On the web service → **Variables** → **Add Reference** → Postgres → `DATABASE_URL`
3. Set the remaining environment variables from `.env.example` on the web service.
4. **Optional — upload volume** (recommended for gallery/product photos):
   - Add a volume mounted at `/app/public/uploads`
   - Set `UPLOAD_DIR=/app/public/uploads`
5. Push to `main` — Railway auto-deploys.

The start script (`scripts/railway-start.sh`) runs the app after an optional schema sync/seed. Database changes are **not** applied on every deploy unless you opt in (see below).

Health checks hit `/api/health` during deploys (`railway.toml`).

### Required environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Reference from the Postgres service |
| `NEXT_PUBLIC_SITE_URL` | Railway `*.up.railway.app` URL or custom domain |
| `AUTH_SECRET` | Random 32+ character string (`openssl rand -base64 32`) |
| `AUTH_URL` | Same as `NEXT_PUBLIC_SITE_URL` |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Strong admin password |
| `SQUARE_ACCESS_TOKEN` | Square API access token |
| `SQUARE_LOCATION_ID` | Square location ID |
| `SQUARE_ENVIRONMENT` | `sandbox` or `production` |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Square webhook signature key |
| `SQUARE_WEBHOOK_NOTIFICATION_URL` | Full URL to `/api/webhooks/square` on your site |

### Optional environment variables

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for order/quote emails |
| `EMAIL_FROM` | Verified sender in Resend (e.g. `B's Sweet Spot <orders@yourdomain.com>`) |
| `UPLOAD_DIR` | Upload directory (use volume path in production) |
| `UPLOAD_MAX_EDGE` | Max image edge in pixels (default `1920`) |
| `UPLOAD_WEBP_QUALITY` | WebP quality 1–100 (default `82`) |
| `RUN_DB_PUSH` | Set to `true` once to run `prisma db push` on deploy, then remove |
| `RUN_DB_SEED` | Set to `true` once to seed menu/reviews/gallery on deploy, then remove |

### First deploy

After `DATABASE_URL` is linked and the first deploy succeeds, seed the database **once** using either method:

**Option A — Railway variable (no shell):**

1. Set `RUN_DB_SEED=true` on the web service
2. Redeploy
3. Remove `RUN_DB_SEED` after seed completes

**Option B — Railway shell:**

```bash
npm run db:seed
```

Schema changes use `prisma db push` locally and via `RUN_DB_PUSH=true` on Railway. This project does not run `prisma migrate deploy` on every deploy.

### Square webhooks

In the [Square Developer Dashboard](https://developer.squareup.com), subscribe your app to payment events and point the notification URL to:

```text
https://your-domain.com/api/webhooks/square
```

Set `SQUARE_WEBHOOK_NOTIFICATION_URL` to that exact URL and `SQUARE_WEBHOOK_SIGNATURE_KEY` to the key Square provides.

### Custom domain

1. Add the domain in Railway → **Settings** → **Custom Domain**
2. Update DNS as instructed
3. Set `NEXT_PUBLIC_SITE_URL` and `AUTH_URL` to `https://your-domain.com`
4. Update `SQUARE_WEBHOOK_NOTIFICATION_URL` to use the new domain

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:seed` | Seed menu, reviews, gallery, and default settings |
| `npm run db:migrate` | Run Prisma migrations (`migrate deploy`) — not used on Railway by default |

## Project structure (high level)

```text
src/app/              Next.js pages and API routes
src/components/       Storefront, order flow, and admin UI
src/lib/              Auth, email, Square, cart, pricing, ordering copy
prisma/               Schema, seed data, migrations
scripts/              Railway start script
public/uploads/       Local image uploads (use a volume on Railway)
```

## License

Private — all rights reserved.
