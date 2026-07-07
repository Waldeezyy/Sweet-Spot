import { Resend } from "resend";
import { formatCents } from "@/lib/utils";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromEmail = process.env.EMAIL_FROM ?? "B's Sweet Spot <onboarding@resend.dev>";
const adminEmail = process.env.ADMIN_EMAIL ?? "bssweetstop25@gmail.com";

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log("[email skipped - no RESEND_API_KEY]", { to, subject });
    return;
  }
  await resend.emails.send({ from: fromEmail, to, subject, html });
}

export async function sendOrderConfirmation(params: {
  to: string;
  orderNumber: string;
  totalCents: number;
  depositCents: number;
  balanceDueCents: number;
  scheduledDate: string;
  pendingReview?: boolean;
}) {
  const { to, orderNumber, totalCents, depositCents, balanceDueCents, scheduledDate, pendingReview } = params;
  await sendEmail(
    to,
    `Order confirmed — ${orderNumber}`,
    `<h1>Thank you for your order!</h1>
    <p>Order <strong>${orderNumber}</strong> for <strong>${scheduledDate}</strong>.</p>
    ${pendingReview ? "<p>Your deposit secures your date. Brandy will confirm your final price within 24 hours based on your design.</p>" : ""}
    <p>Total: ${formatCents(totalCents)}<br/>Deposit paid: ${formatCents(depositCents)}<br/>Balance due: ${formatCents(balanceDueCents)}</p>`
  );
}

export async function sendAdminNewOrder(params: {
  orderNumber: string;
  customerName: string;
  totalCents: number;
  pendingReview?: boolean;
}) {
  await sendEmail(
    adminEmail,
    `New order — ${params.orderNumber}`,
    `<h1>New order received</h1>
    <p><strong>${params.orderNumber}</strong> from ${params.customerName}</p>
    <p>Total: ${formatCents(params.totalCents)}</p>
    ${params.pendingReview ? "<p><strong>Needs price review</strong> (semi-custom item)</p>" : ""}`
  );
}

export async function sendOrderStatusUpdate(params: {
  to: string;
  orderNumber: string;
  status: string;
}) {
  await sendEmail(
    params.to,
    `Order update — ${params.orderNumber}`,
    `<p>Your order <strong>${params.orderNumber}</strong> is now: <strong>${params.status.replace(/_/g, " ")}</strong></p>`
  );
}

export async function sendQuoteToCustomer(params: {
  to: string;
  customerName: string;
  quotedPriceCents: number;
  message?: string;
  paymentUrl: string;
}) {
  await sendEmail(
    params.to,
    "Your custom order quote from B's Sweet Spot",
    `<h1>Hi ${params.customerName},</h1>
    <p>Brandy has sent you a quote for your custom order.</p>
    <p><strong>Price: ${formatCents(params.quotedPriceCents)}</strong></p>
    ${params.message ? `<p>${params.message}</p>` : ""}
    <p><a href="${params.paymentUrl}">Approve & Pay Deposit</a></p>`
  );
}

export async function sendQuoteRequestToAdmin(params: {
  customerName: string;
  occasion: string;
  scheduledDate: string;
}) {
  await sendEmail(
    adminEmail,
    `New custom order request from ${params.customerName}`,
    `<p><strong>${params.customerName}</strong> requested a custom order.</p>
    <p>Occasion: ${params.occasion}<br/>Date: ${params.scheduledDate}</p>`
  );
}

export async function sendContactForm(params: {
  name: string;
  email: string;
  message: string;
}) {
  await sendEmail(
    adminEmail,
    `Contact form — ${params.name}`,
    `<p>From: ${params.name} (${params.email})</p><p>${params.message}</p>`
  );
}
