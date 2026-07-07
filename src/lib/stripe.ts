import Stripe from "stripe";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const stripe = isStripeConfigured()
  ? new Stripe(process.env.STRIPE_SECRET_KEY!)
  : null;
