import type { FulfillmentType, OrderStatus } from "@prisma/client";

export const TRACKABLE_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_DEPOSIT: "Awaiting deposit",
  PENDING_REVIEW: "Price review",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const STATUS_CUSTOMER_MESSAGE: Record<string, { subject: string; headline: string; body: string }> = {
  CONFIRMED: {
    subject: "Order confirmed",
    headline: "Your order is confirmed!",
    body: "We've received your order and it's on the calendar.",
  },
  IN_PROGRESS: {
    subject: "We're making your order",
    headline: "We're making your order now!",
    body: "Brandy is working on your treats. We'll let you know when they're ready.",
  },
  READY: {
    subject: "Ready for pickup",
    headline: "Your order is ready!",
    body: "Come pick up your order at your scheduled time.",
  },
  COMPLETED: {
    subject: "Order complete",
    headline: "Thanks for your order!",
    body: "We hope you enjoyed your treats. See you next time!",
  },
  CANCELLED: {
    subject: "Order cancelled",
    headline: "Your order was cancelled",
    body: "If you have questions, please reach out to us.",
  },
};

export function getReadyMessage(fulfillmentType: FulfillmentType): string {
  return fulfillmentType === "DELIVERY"
    ? "Your order is ready and will be delivered as scheduled!"
    : "Your order is ready for pickup!";
}

export function getTimelineStep(status: OrderStatus): number {
  if (status === "CANCELLED") return -1;
  if (status === "PENDING_DEPOSIT" || status === "PENDING_REVIEW") return 0;
  if (status === "CONFIRMED") return 1;
  if (status === "IN_PROGRESS") return 2;
  if (status === "READY") return 3;
  return 4;
}
