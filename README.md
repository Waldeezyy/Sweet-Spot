# B's Sweet Spot

Custom bakery website for B's Sweet Spot — made-to-order cakes and treats in Dimondale, Michigan.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **PostgreSQL** via Prisma
- **NextAuth** (email magic link for admin)
- **Stripe** (order deposits)
- **Resend** (transactional email)
- **Railway** (hosting)

## Local Development

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

## Railway Deployment

1. Create a Railway project and connect to GitHub repo `Waldeezyy/Sweet-Spot`
2. Add the **PostgreSQL** plugin
3. Set environment variables from `.env.example` in Railway dashboard
4. Railway auto-deploys on push to `main`

### Required Railway env vars

| Variable | Description |
|---|---|
| `DATABASE_URL` | Auto-set by Postgres plugin |
| `NEXT_PUBLIC_SITE_URL` | Your Railway URL or custom domain |
| `AUTH_SECRET` | Random 32+ char string |
| `AUTH_URL` | Same as `NEXT_PUBLIC_SITE_URL` |
| `ADMIN_EMAIL` | Brandy's email for admin login |
| `RESEND_API_KEY` | For emails |
| `EMAIL_FROM` | Verified sender in Resend |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

### First deploy

After first deploy, run seed via Railway shell:
```bash
npm run db:seed
```

### Custom domain

1. Purchase domain
2. Railway → Settings → Custom Domain → add domain
3. Update DNS records as instructed
4. Set `NEXT_PUBLIC_SITE_URL` and `AUTH_URL` to your domain

## Admin Dashboard

Visit `/admin/login` and sign in with the email set in `ADMIN_EMAIL`. Brandy can:

- **My Menu** — add/edit/hide items and prices
- **My Photos** — upload gallery images
- **Orders** — view and update order status
- **Custom Requests** — send quotes for one-off orders
- **My Schedule** — block unavailable dates
- **Shop Settings** — update policies and contact info

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed menu, reviews, gallery |
| `npm run db:migrate` | Run migrations (production) |
