import { format } from "date-fns";
import { formatCents } from "@/lib/utils";
import { formatOrderItemLine } from "@/lib/order-item-display";
import { getReadyMessage } from "@/lib/order-tracking";
import { preferredContactLabel } from "@/lib/preferred-contact";
import type { FulfillmentType, PreferredContactMethod } from "@prisma/client";

export type OrderEmailItem = {
  productName: string;
  productSlug?: string | null;
  quantity: number;
  flavor?: string | null;
  frosting?: string | null;
  toppings?: string | null;
  writing?: string | null;
  designNotes?: string | null;
  portions?: unknown;
};

function fulfillmentLabel(type: FulfillmentType): string {
  return type === "DELIVERY" ? "Delivery" : "Pickup";
}

export function buildOrderItemsHtml(items: OrderEmailItem[]): string {
  if (!items.length) return "";
  const rows = items
    .map((item) => `<li style="margin: 0 0 8px;">${formatOrderItemLine(item)}</li>`)
    .join("");
  return `
    <h2 style="font-size: 16px; margin: 24px 0 8px;">Your order</h2>
    <ul style="margin: 0; padding-left: 20px; color: #5c5348;">${rows}</ul>`;
}

export function buildOrderDetailsHtml(params: {
  scheduledDate: string;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: string | null;
}): string {
  const lines = [
    `Scheduled for <strong>${params.scheduledDate}</strong>`,
    fulfillmentLabel(params.fulfillmentType),
  ];
  if (params.fulfillmentType === "DELIVERY" && params.deliveryAddress) {
    lines.push(`Deliver to: ${params.deliveryAddress}`);
  }
  return `<p style="margin: 16px 0; color: #5c5348; line-height: 1.5;">${lines.join("<br/>")}</p>`;
}

export function buildPaymentSummaryHtml(params: {
  totalCents: number;
  depositCents: number;
  balanceDueCents: number;
  paidInFull: boolean;
  finalTotalCents?: number | null;
}): string {
  const total = params.finalTotalCents ?? params.totalCents;
  const lines = [`Order total: <strong>${formatCents(total)}</strong>`];
  if (params.paidInFull) {
    lines.push(`Paid in full: <strong>${formatCents(params.depositCents)}</strong>`);
  } else {
    lines.push(`Deposit paid: <strong>${formatCents(params.depositCents)}</strong>`);
    if (params.balanceDueCents > 0) {
      lines.push(`Balance due: <strong>${formatCents(params.balanceDueCents)}</strong>`);
    }
  }
  return `
    <h2 style="font-size: 16px; margin: 24px 0 8px;">Payment</h2>
    <p style="margin: 0; color: #5c5348; line-height: 1.6;">${lines.join("<br/>")}</p>`;
}

export function buildBalanceDueInstructionsHtml(params: {
  balanceDueCents: number;
  fulfillmentType: FulfillmentType;
  trackLink: string;
  onlinePaymentEnabled?: boolean;
}): string {
  if (params.balanceDueCents <= 0) return "";
  const when = params.fulfillmentType === "DELIVERY" ? "at delivery" : "at pickup";
  const onlinePay = params.onlinePaymentEnabled
    ? `
      <p style="margin: 16px 0 0;">
        <a href="${params.trackLink}" style="display: inline-block; padding: 12px 20px; background: #7d8b6f; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Pay ${formatCents(params.balanceDueCents)} online
        </a>
      </p>
      <p style="margin: 12px 0 0; font-size: 14px; color: #5c5348;">
        Or pay ${when} with <strong>cash, Venmo, or Cash App</strong>.
      </p>`
    : `<p style="margin: 8px 0 0; line-height: 1.6;">
        Pay ${when} with <strong>cash, Venmo, or Cash App</strong>.
      </p>`;

  return `
    <div style="margin: 24px 0; padding: 16px; background: #f9f5f0; border-radius: 8px;">
      <h2 style="font-size: 16px; margin: 0 0 8px;">Remaining balance</h2>
      <p style="margin: 0; line-height: 1.6;">
        <strong>${formatCents(params.balanceDueCents)}</strong> remaining on your order.
      </p>
      ${onlinePay}
      <p style="margin: 12px 0 0; font-size: 14px; color: #5c5348;">
        View your full order and pickup details on your
        <a href="${params.trackLink}" style="color: #c97b84;">tracking page</a>.
      </p>
    </div>`;
}

export function buildTrackButtonHtml(trackLink: string): string {
  return `
    <p style="margin: 28px 0 8px;">
      <a href="${trackLink}" style="display: inline-block; padding: 12px 20px; background: #7d8b6f; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Track your order
      </a>
    </p>
    <p style="margin: 0; font-size: 14px; color: #5c5348;">
      Or copy this link: <a href="${trackLink}" style="color: #c97b84;">${trackLink}</a>
    </p>`;
}

export function buildStatusBodyHtml(params: {
  status: string;
  scheduledDate: string;
  fulfillmentType: FulfillmentType;
  estimatedReadyAt?: Date | null;
  pickupInstructions?: string;
  finalTotalCents?: number | null;
  balanceDueCents?: number;
}): string {
  let body = "";

  switch (params.status) {
    case "CONFIRMED":
      body = `<p style="margin: 0; line-height: 1.6;">Your order is confirmed for <strong>${params.scheduledDate}</strong>. We've got it on the calendar and will start making it soon.</p>`;
      break;
    case "IN_PROGRESS":
      body = `<p style="margin: 0; line-height: 1.6;">Brandy is making your treats now!`;
      if (params.estimatedReadyAt) {
        body += ` We expect them to be ready around <strong>${format(params.estimatedReadyAt, "EEEE, MMMM d 'at' h:mm a")}</strong>.`;
      }
      body += ` We'll email you again when everything is ready.</p>`;
      break;
    case "READY":
      body = `<p style="margin: 0; line-height: 1.6;">${getReadyMessage(params.fulfillmentType)}</p>`;
      if (params.pickupInstructions) {
        body += `<p style="margin: 12px 0 0; line-height: 1.6;"><strong>${params.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"} details:</strong><br/>${params.pickupInstructions}</p>`;
      }
      break;
    case "COMPLETED":
      body = `<p style="margin: 0; line-height: 1.6;">Thank you for ordering from B's Sweet Spot! We hope you loved your treats and can't wait to bake for you again.</p>`;
      break;
    case "CANCELLED":
      body = `<p style="margin: 0; line-height: 1.6;">Your order has been cancelled. If you have questions or would like to place a new order, please reach out — we're happy to help.</p>`;
      break;
    default:
      body = `<p style="margin: 0; line-height: 1.6;">Your order status has been updated.</p>`;
  }

  if (params.status === "CONFIRMED" && params.finalTotalCents != null) {
    body += `<p style="margin: 12px 0 0; line-height: 1.6;">Your final total is <strong>${formatCents(params.finalTotalCents)}</strong>`;
    if (params.balanceDueCents != null && params.balanceDueCents > 0) {
      body += ` with <strong>${formatCents(params.balanceDueCents)}</strong> due at ${params.fulfillmentType === "DELIVERY" ? "delivery" : "pickup"}`;
    }
    body += `.</p>`;
  }

  return body;
}

export function buildMessageCalloutHtml(message: string, title = "A note from Brandy"): string {
  return `
    <div style="margin: 20px 0; padding: 16px; background: #f9f5f0; border-left: 4px solid #c97b84; border-radius: 8px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #7d8b6f;">${title}</p>
      <p style="margin: 0; line-height: 1.6; color: #3d3630;">${message}</p>
    </div>`;
}

export function buildPayButtonHtml(paymentUrl: string, label: string): string {
  return `
    <p style="margin: 28px 0 8px;">
      <a href="${paymentUrl}" style="display: inline-block; padding: 12px 20px; background: #7d8b6f; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        ${label}
      </a>
    </p>
    <p style="margin: 0; font-size: 14px; color: #5c5348;">
      Or copy this link to pay: <a href="${paymentUrl}" style="color: #c97b84;">${paymentUrl}</a>
    </p>`;
}

export function buildCustomerContactHtml(params: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  preferredContactMethod?: PreferredContactMethod | null;
}): string {
  const lines = [
    `<strong>${params.customerName}</strong>`,
    params.customerEmail,
  ];
  if (params.customerPhone) {
    lines.push(params.customerPhone);
  }
  const preferredLabel = preferredContactLabel(params.preferredContactMethod);
  if (preferredLabel) {
    lines.push(`<strong>Preferred contact:</strong> ${preferredLabel}`);
  }
  return `
    <h2 style="font-size: 16px; margin: 24px 0 8px;">Customer</h2>
    <p style="margin: 0; color: #5c5348; line-height: 1.6;">${lines.join("<br/>")}</p>`;
}

export function buildAdminManageButtonHtml(adminUrl: string): string {
  return `
    <p style="margin: 24px 0 8px;">
      <a href="${adminUrl}" style="display: inline-block; padding: 12px 20px; background: #7d8b6f; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Manage in admin
      </a>
    </p>`;
}

export function buildAdminOrderNotificationHtml(params: {
  headline: string;
  intro: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  preferredContactMethod?: PreferredContactMethod | null;
  totalCents: number;
  finalTotalCents?: number | null;
  scheduledDate?: string;
  fulfillmentType?: FulfillmentType;
  deliveryAddress?: string | null;
  items?: OrderEmailItem[];
  adminUrl: string;
  extraNotes?: string;
}): string {
  const total = params.finalTotalCents ?? params.totalCents;
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; color: #3d3630; max-width: 560px;">
      <h1 style="font-size: 24px; margin: 0 0 8px; color: #7d8b6f;">${params.headline}</h1>
      <p style="margin: 0 0 4px; font-size: 14px; color: #5c5348;">Order <strong>${params.orderNumber}</strong></p>
      <p style="margin: 0 0 16px; line-height: 1.6;">${params.intro}</p>
      ${params.extraNotes ? `<p style="margin: 0 0 16px; line-height: 1.6; color: #5c5348;">${params.extraNotes}</p>` : ""}
      ${buildCustomerContactHtml({
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        preferredContactMethod: params.preferredContactMethod,
      })}
      ${
        params.scheduledDate && params.fulfillmentType
          ? buildOrderDetailsHtml({
              scheduledDate: params.scheduledDate,
              fulfillmentType: params.fulfillmentType,
              deliveryAddress: params.deliveryAddress,
            })
          : ""
      }
      ${params.items?.length ? buildOrderItemsHtml(params.items) : ""}
      <h2 style="font-size: 16px; margin: 24px 0 8px;">Order value</h2>
      <p style="margin: 0; color: #5c5348; line-height: 1.6;">Total: <strong>${formatCents(total)}</strong></p>
      ${buildAdminManageButtonHtml(params.adminUrl)}
    </div>`;
}

export function buildOrderConfirmationBodyHtml(params: {
  pendingReview?: boolean;
  paidInFull: boolean;
  balanceDueCents: number;
  fulfillmentType: FulfillmentType;
  fromCustomQuote?: boolean;
}): string {
  let body = `<p style="margin: 0; line-height: 1.6;">Thank you for your order! We've received your payment and your order is on the calendar.</p>`;

  if (params.fromCustomQuote) {
    body += `<p style="margin: 12px 0 0; line-height: 1.6;">This confirms your custom order from Brandy's quote.</p>`;
  }

  if (params.pendingReview) {
    body += params.paidInFull
      ? `<p style="margin: 12px 0 0; line-height: 1.6;">Brandy will confirm your final price within 24 hours based on your design. If the final total is higher, we'll reach out about the difference.</p>`
      : `<p style="margin: 12px 0 0; line-height: 1.6;">Your deposit secures your date. Brandy will confirm your final price within 24 hours based on your design.</p>`;
  }

  if (!params.paidInFull && params.balanceDueCents > 0) {
    const when = params.fulfillmentType === "DELIVERY" ? "delivery" : "pickup";
    body += `<p style="margin: 12px 0 0; line-height: 1.6;">The remaining balance is due at ${when}. You can <strong>pay online from your tracking page</strong> when your order is ready, or pay with cash, Venmo, or Cash App at ${when}.</p>`;
  }

  body += `<p style="margin: 12px 0 0; line-height: 1.6;">You'll receive email updates as Brandy works on your order. You can also check status anytime using the link below.</p>`;

  return body;
}
