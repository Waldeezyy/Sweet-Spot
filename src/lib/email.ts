import { Resend } from "resend";
import { format } from "date-fns";
import { formatCents } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site-url";
import { STATUS_CUSTOMER_MESSAGE } from "@/lib/order-tracking";
import {
  buildBalanceDueInstructionsHtml,
  buildOrderConfirmationBodyHtml,
  buildOrderDetailsHtml,
  buildOrderItemsHtml,
  buildPaymentSummaryHtml,
  buildStatusBodyHtml,
  buildTrackButtonHtml,
  type OrderEmailItem,
} from "@/lib/order-email-html";
import type { FulfillmentType } from "@prisma/client";
import { stripe } from "@/lib/stripe";

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
  const { data, error } = await resend.emails.send({ from: fromEmail, to, subject, html });
  if (error) {
    console.error("[email failed]", { to, subject, error });
    throw new Error(error.message);
  }
  console.log("[email sent]", { to, subject, id: data?.id });
}

export async function sendOrderConfirmation(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalCents: number;
  depositCents: number;
  balanceDueCents: number;
  scheduledDate: string;
  fulfillmentType: FulfillmentType;
  items: OrderEmailItem[];
  paidInFull: boolean;
  trackingToken: string;
  deliveryAddress?: string | null;
  pendingReview?: boolean;
  fromCustomQuote?: boolean;
}) {
  const siteUrl = await getSiteUrl();
  const trackLink = `${siteUrl}/order/status/${params.trackingToken}`;

  const intro = buildOrderConfirmationBodyHtml({
    pendingReview: params.pendingReview,
    paidInFull: params.paidInFull,
    balanceDueCents: params.balanceDueCents,
    fulfillmentType: params.fulfillmentType,
    fromCustomQuote: params.fromCustomQuote,
  });

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; color: #3d3630; max-width: 560px;">
      <h1 style="font-size: 24px; margin: 0 0 8px; color: #7d8b6f;">Thank you for your order!</h1>
      <p style="margin: 0 0 4px; font-size: 14px; color: #5c5348;">Order <strong>${params.orderNumber}</strong></p>
      <p style="margin: 0 0 16px; line-height: 1.6;">Hi ${params.customerName},</p>
      ${intro}
      ${buildOrderDetailsHtml({
        scheduledDate: params.scheduledDate,
        fulfillmentType: params.fulfillmentType,
        deliveryAddress: params.deliveryAddress,
      })}
      ${buildOrderItemsHtml(params.items)}
      ${buildPaymentSummaryHtml({
        totalCents: params.totalCents,
        depositCents: params.depositCents,
        balanceDueCents: params.balanceDueCents,
        paidInFull: params.paidInFull,
      })}
      ${buildTrackButtonHtml(trackLink)}
    </div>`;

  await sendEmail(params.to, `Order confirmed — ${params.orderNumber}`, html);
}

type OrderForConfirmationEmail = {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  totalCents: number;
  depositCents: number;
  balanceDueCents: number;
  scheduledDate: Date;
  fulfillmentType: FulfillmentType;
  deliveryAddress: string | null;
  paidInFull: boolean;
  trackingToken: string;
  items: OrderEmailItem[];
};

export async function sendOrderConfirmationFromOrder(
  order: OrderForConfirmationEmail,
  opts?: { pendingReview?: boolean; fromCustomQuote?: boolean }
) {
  await sendOrderConfirmation({
    to: order.customerEmail,
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    totalCents: order.totalCents,
    depositCents: order.depositCents,
    balanceDueCents: order.balanceDueCents,
    scheduledDate: format(order.scheduledDate, "EEEE, MMMM d, yyyy"),
    fulfillmentType: order.fulfillmentType,
    items: order.items,
    paidInFull: order.paidInFull,
    trackingToken: order.trackingToken,
    deliveryAddress: order.deliveryAddress,
    pendingReview: opts?.pendingReview,
    fromCustomQuote: opts?.fromCustomQuote,
  });
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
  customerName: string;
  orderNumber: string;
  status: string;
  scheduledDate: string;
  fulfillmentType: FulfillmentType;
  trackingToken: string;
  items: OrderEmailItem[];
  totalCents: number;
  depositCents: number;
  balanceDueCents: number;
  paidInFull: boolean;
  deliveryAddress?: string | null;
  pickupInstructions?: string;
  finalTotalCents?: number | null;
  estimatedReadyAt?: Date | null;
}) {
  const siteUrl = await getSiteUrl();
  const trackLink = `${siteUrl}/order/status/${params.trackingToken}`;
  const template = STATUS_CUSTOMER_MESSAGE[params.status];

  const headline = template?.headline ?? `Status: ${params.status.replace(/_/g, " ")}`;
  const subject = template?.subject
    ? `${template.subject} — ${params.orderNumber}`
    : `Order update — ${params.orderNumber}`;

  const statusBody = buildStatusBodyHtml({
    status: params.status,
    scheduledDate: params.scheduledDate,
    fulfillmentType: params.fulfillmentType,
    estimatedReadyAt: params.estimatedReadyAt,
    pickupInstructions: params.pickupInstructions,
    finalTotalCents: params.finalTotalCents,
    balanceDueCents: params.balanceDueCents,
  });

  const balanceBlock =
    params.status === "READY" && !params.paidInFull && params.balanceDueCents > 0
      ? buildBalanceDueInstructionsHtml({
          balanceDueCents: params.balanceDueCents,
          fulfillmentType: params.fulfillmentType,
          trackLink,
          stripeEnabled: Boolean(stripe),
        })
      : "";

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; color: #3d3630; max-width: 560px;">
      <h1 style="font-size: 24px; margin: 0 0 8px; color: #7d8b6f;">${headline}</h1>
      <p style="margin: 0 0 4px; font-size: 14px; color: #5c5348;">Order <strong>${params.orderNumber}</strong></p>
      <p style="margin: 0 0 16px; line-height: 1.6;">Hi ${params.customerName},</p>
      ${statusBody}
      ${buildOrderDetailsHtml({
        scheduledDate: params.scheduledDate,
        fulfillmentType: params.fulfillmentType,
        deliveryAddress: params.deliveryAddress,
      })}
      ${buildOrderItemsHtml(params.items)}
      ${buildPaymentSummaryHtml({
        totalCents: params.totalCents,
        depositCents: params.depositCents,
        balanceDueCents: params.balanceDueCents,
        paidInFull: params.paidInFull,
        finalTotalCents: params.finalTotalCents,
      })}
      ${balanceBlock}
      ${buildTrackButtonHtml(trackLink)}
    </div>`;

  await sendEmail(params.to, subject, html);
}

export async function sendQuoteToCustomer(params: {
  to: string;
  customerName: string;
  quotedPriceCents: number;
  message?: string;
  paymentUrl: string;
  statusUrl?: string;
}) {
  await sendEmail(
    params.to,
    "Your custom order quote from B's Sweet Spot",
    `<h1>Hi ${params.customerName},</h1>
    <p>Brandy has sent you a quote for your custom order.</p>
    <p><strong>Price: ${formatCents(params.quotedPriceCents)}</strong></p>
    ${params.message ? `<p>${params.message}</p>` : ""}
    <p><a href="${params.paymentUrl}">Review quote & pay online</a></p>
    ${params.statusUrl ? `<p><a href="${params.statusUrl}">Check quote status</a></p>` : ""}
    <p class="text-sm">Prefer Venmo, Cash App, or cash? Reply to Brandy directly — online payment is optional.</p>`
  );
}

export async function sendQuoteDeclined(params: {
  to: string;
  customerName: string;
  message?: string;
}) {
  await sendEmail(
    params.to,
    "Update on your custom order request — B's Sweet Spot",
    `<h1>Hi ${params.customerName},</h1>
    <p>Thank you for thinking of B's Sweet Spot. Unfortunately we're not able to take this custom order at this time.</p>
    ${params.message ? `<p>${params.message}</p>` : ""}
    <p>Feel free to reach out at bssweetstop25@gmail.com or browse our <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/menu">menu</a> for other options.</p>`
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

export async function sendRushRequestToAdmin(params: {
  orderNumber: string;
  customerName: string;
  scheduledDate: string;
  totalCents: number;
}) {
  await sendEmail(
    adminEmail,
    `Rush order request — ${params.orderNumber}`,
    `<h1>New rush order request</h1>
    <p><strong>${params.orderNumber}</strong> from ${params.customerName}</p>
    <p>Requested date: ${params.scheduledDate}<br/>Order total: ${formatCents(params.totalCents)} (rush fee not yet included)</p>
    <p>Review and approve or decline in your admin orders inbox.</p>`
  );
}

export async function sendRushRequestReceived(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  scheduledDate: string;
  trackingToken: string;
}) {
  const siteUrl = await getSiteUrl();
  const trackLink = `${siteUrl}/order/status/${params.trackingToken}`;

  await sendEmail(
    params.to,
    `Rush order request received — ${params.orderNumber}`,
    `<h1>Hi ${params.customerName},</h1>
    <p>We received your rush order request for <strong>${params.scheduledDate}</strong>.</p>
    <p>Brandy will review whether we can accommodate your date. You will not be charged unless your request is approved.</p>
    <p>If approved, we will email you a link to pay online (including the rush fee).</p>
    <p>Order <strong>${params.orderNumber}</strong></p>
    <p><a href="${trackLink}">Track your request</a></p>`
  );
}

export async function sendRushApproved(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  finalTotalCents: number;
  rushFeeCents: number;
  paymentUrl: string;
  message?: string;
}) {
  await sendEmail(
    params.to,
    `Rush order approved — ${params.orderNumber}`,
    `<h1>Hi ${params.customerName},</h1>
    <p>Great news — your rush order has been approved!</p>
    <p><strong>Total due: ${formatCents(params.finalTotalCents)}</strong> (includes ${formatCents(params.rushFeeCents)} rush fee)</p>
    ${params.message ? `<p>${params.message}</p>` : ""}
    <p><a href="${params.paymentUrl}">Pay online & confirm your order</a></p>
    <p class="text-sm">Prefer Venmo, Cash App, or cash? Reply to Brandy directly — online payment is optional.</p>`
  );
}

export async function sendRushDeclined(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  message?: string;
}) {
  const siteUrl = await getSiteUrl();
  await sendEmail(
    params.to,
    `Update on your rush order — ${params.orderNumber}`,
    `<h1>Hi ${params.customerName},</h1>
    <p>Thank you for thinking of B's Sweet Spot. Unfortunately we're not able to accommodate this rush order for your requested date.</p>
    ${params.message ? `<p>${params.message}</p>` : ""}
    <p>Feel free to reach out at bssweetstop25@gmail.com or browse our <a href="${siteUrl}/menu">menu</a> for other options.</p>`
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
