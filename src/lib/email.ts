import { Resend } from "resend";
import { format } from "date-fns";
import { formatCents, escapeHtml } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site-url";
import { STATUS_CUSTOMER_MESSAGE } from "@/lib/order-tracking";
import {
  buildAdminManageButtonHtml,
  buildBalanceDueInstructionsHtml,
  buildAdminOrderNotificationHtml,
  buildCustomerContactHtml,
  buildMessageCalloutHtml,
  buildOrderConfirmationBodyHtml,
  buildOrderDetailsHtml,
  buildOrderItemsHtml,
  buildPayButtonHtml,
  buildPaymentSummaryHtml,
  buildStatusBodyHtml,
  buildTrackButtonHtml,
  type OrderEmailItem,
} from "@/lib/order-email-html";
import type { FulfillmentType } from "@prisma/client";
import { isSquareConfigured } from "@/lib/square";

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
  customerEmail: string;
  customerPhone?: string | null;
  totalCents: number;
  finalTotalCents?: number | null;
  scheduledDate?: string;
  fulfillmentType?: FulfillmentType;
  deliveryAddress?: string | null;
  items?: OrderEmailItem[];
  pendingReview?: boolean;
  paymentReceived?: boolean;
}) {
  const siteUrl = await getSiteUrl();
  const adminUrl = `${siteUrl}/admin/orders`;
  const intro = params.paymentReceived
    ? `Payment received for <strong>${params.orderNumber}</strong>.`
    : `New order <strong>${params.orderNumber}</strong> has been received.`;

  const extraNotes = [
    params.pendingReview ? "<strong>Needs price review</strong> (semi-custom or rush item)." : "",
    params.paymentReceived ? "Customer payment was completed online." : "",
  ]
    .filter(Boolean)
    .join(" ");

  const html = buildAdminOrderNotificationHtml({
    headline: params.paymentReceived ? "Order payment received" : "New order received",
    intro,
    orderNumber: params.orderNumber,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    totalCents: params.totalCents,
    finalTotalCents: params.finalTotalCents,
    scheduledDate: params.scheduledDate,
    fulfillmentType: params.fulfillmentType,
    deliveryAddress: params.deliveryAddress,
    items: params.items,
    adminUrl,
    extraNotes: extraNotes || undefined,
  });

  const subject = params.paymentReceived
    ? `Payment received — ${params.orderNumber}`
    : `New order — ${params.orderNumber}`;

  await sendEmail(adminEmail, subject, html);
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
          onlinePaymentEnabled: isSquareConfigured(),
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
  customerEmail: string;
  customerPhone?: string | null;
  occasion: string;
  scheduledDate: string;
  description?: string;
  servings?: number | null;
  budgetRange?: string | null;
}) {
  const siteUrl = await getSiteUrl();
  const adminUrl = `${siteUrl}/admin/custom-requests`;
  const details = [
    `Occasion: <strong>${params.occasion}</strong>`,
    `Date: <strong>${params.scheduledDate}</strong>`,
  ];
  if (params.servings) details.push(`Servings: ${params.servings}`);
  if (params.budgetRange) details.push(`Budget: ${params.budgetRange}`);

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; color: #3d3630; max-width: 560px;">
      <h1 style="font-size: 24px; margin: 0 0 8px; color: #7d8b6f;">New custom order request</h1>
      <p style="margin: 0 0 16px; line-height: 1.6;"><strong>${escapeHtml(params.customerName)}</strong> requested a custom order quote.</p>
      ${buildCustomerContactHtml({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
      })}
      <h2 style="font-size: 16px; margin: 24px 0 8px;">Request details</h2>
      <p style="margin: 0; color: #5c5348; line-height: 1.6;">${details.join("<br/>")}</p>
      ${params.description ? `<p style="margin: 16px 0 0; color: #5c5348; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(params.description)}</p>` : ""}
      ${buildAdminManageButtonHtml(adminUrl)}
    </div>`;

  await sendEmail(adminEmail, `New custom order request from ${params.customerName}`, html);
}

export async function sendRushRequestToAdmin(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  scheduledDate: string;
  totalCents: number;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: string | null;
  items: OrderEmailItem[];
}) {
  const siteUrl = await getSiteUrl();
  const adminUrl = `${siteUrl}/admin/orders`;

  const html = buildAdminOrderNotificationHtml({
    headline: "New rush order request",
    intro: `<strong>${params.customerName}</strong> submitted a rush order request that needs your approval.`,
    orderNumber: params.orderNumber,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    totalCents: params.totalCents,
    scheduledDate: params.scheduledDate,
    fulfillmentType: params.fulfillmentType,
    deliveryAddress: params.deliveryAddress,
    items: params.items,
    adminUrl,
    extraNotes: `Order subtotal: <strong>${formatCents(params.totalCents)}</strong> (rush fee not yet included). Review and approve or decline in admin.`,
  });

  await sendEmail(adminEmail, `Rush order request — ${params.orderNumber}`, html);
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
  baseTotalCents: number;
  paymentUrl: string;
  message?: string;
}) {
  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; color: #3d3630; max-width: 560px;">
      <h1 style="font-size: 24px; margin: 0 0 8px; color: #7d8b6f;">Rush order approved!</h1>
      <p style="margin: 0 0 4px; font-size: 14px; color: #5c5348;">Order <strong>${params.orderNumber}</strong></p>
      <p style="margin: 0 0 16px; line-height: 1.6;">Hi ${params.customerName},</p>
      <p style="margin: 0 0 16px; line-height: 1.6;">Great news — your rush order has been approved!</p>
      ${params.message ? buildMessageCalloutHtml(params.message) : ""}
      <h2 style="font-size: 16px; margin: 24px 0 8px;">Payment</h2>
      <p style="margin: 0; color: #5c5348; line-height: 1.6;">
        Order subtotal: ${formatCents(params.baseTotalCents)}<br/>
        Rush fee: ${formatCents(params.rushFeeCents)}<br/>
        <strong>Total due: ${formatCents(params.finalTotalCents)}</strong>
      </p>
      ${buildPayButtonHtml(params.paymentUrl, "Pay online & confirm your order")}
      <p style="margin: 16px 0 0; font-size: 14px; color: #5c5348;">
        Prefer Venmo, Cash App, or cash? Reply to Brandy directly — online payment is optional.
      </p>
    </div>`;

  await sendEmail(params.to, `Rush order approved — ${params.orderNumber}`, html);
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

export async function sendCustomOrderRequestReceived(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  scheduledDate: string;
  trackingToken: string;
  isRush?: boolean;
}) {
  const siteUrl = await getSiteUrl();
  const trackLink = `${siteUrl}/order/status/${params.trackingToken}`;
  const rushNote = params.isRush
    ? "<p>Your requested date is inside our standard lead time, so Brandy will also confirm whether we can accommodate the rush timing.</p>"
    : "";

  await sendEmail(
    params.to,
    `Custom order request received — ${params.orderNumber}`,
    `<h1>Hi ${params.customerName},</h1>
    <p>We received your custom order request for <strong>${params.scheduledDate}</strong>.</p>
    <p>Brandy will review your order and send you a quoted price within about 24 hours. You will not be charged until you review and pay the final quote.</p>
    ${rushNote}
    <p>Order <strong>${params.orderNumber}</strong></p>
    <p><a href="${trackLink}">Track your request</a></p>`
  );
}

export async function sendCustomOrderRequestToAdmin(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  scheduledDate: string;
  totalCents: number;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: string | null;
  items: OrderEmailItem[];
  isRush?: boolean;
}) {
  const siteUrl = await getSiteUrl();
  const adminUrl = `${siteUrl}/admin/orders`;

  const html = buildAdminOrderNotificationHtml({
    headline: "New custom order request",
    intro: `<strong>${params.customerName}</strong> submitted a custom order that needs your quoted price before payment.`,
    orderNumber: params.orderNumber,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    totalCents: params.totalCents,
    scheduledDate: params.scheduledDate,
    fulfillmentType: params.fulfillmentType,
    deliveryAddress: params.deliveryAddress,
    items: params.items,
    adminUrl,
    extraNotes: `Estimated total: <strong>${formatCents(params.totalCents)}</strong> (not final — set quoted price in admin).${
      params.isRush ? " Customer also requested a rush date." : ""
    }`,
  });

  await sendEmail(adminEmail, `Custom order request — ${params.orderNumber}`, html);
}

export async function sendOrderQuoted(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  finalTotalCents: number;
  paymentUrl: string;
  message?: string;
}) {
  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; color: #3d3630; max-width: 560px;">
      <h1 style="font-size: 24px; margin: 0 0 8px; color: #7d8b6f;">Your order quote is ready!</h1>
      <p style="margin: 0 0 4px; font-size: 14px; color: #5c5348;">Order <strong>${params.orderNumber}</strong></p>
      <p style="margin: 0 0 16px; line-height: 1.6;">Hi ${params.customerName},</p>
      <p style="margin: 0 0 16px; line-height: 1.6;">Brandy has reviewed your custom order and sent you a quote.</p>
      ${params.message ? buildMessageCalloutHtml(params.message) : ""}
      <h2 style="font-size: 16px; margin: 24px 0 8px;">Quoted price</h2>
      <p style="margin: 0; color: #5c5348; line-height: 1.6;">
        <strong>Total due: ${formatCents(params.finalTotalCents)}</strong>
      </p>
      ${buildPayButtonHtml(params.paymentUrl, "Review quote & pay online")}
      <p style="margin: 16px 0 0; font-size: 14px; color: #5c5348;">
        Prefer Venmo, Cash App, or cash? Reply to Brandy directly — online payment is optional.
      </p>
    </div>`;

  await sendEmail(params.to, `Your order quote — ${params.orderNumber}`, html);
}

export async function sendOrderQuoteDeclined(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  message?: string;
}) {
  const siteUrl = await getSiteUrl();
  await sendEmail(
    params.to,
    `Update on your custom order — ${params.orderNumber}`,
    `<h1>Hi ${params.customerName},</h1>
    <p>Thank you for thinking of B's Sweet Spot. Unfortunately we're not able to take this custom order at this time.</p>
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
