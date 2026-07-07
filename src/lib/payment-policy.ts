import type { CartItem } from "@/lib/cart";
import { calculateDeposit, hasSemiCustom } from "@/lib/cart";

export type PaymentChoice = "deposit" | "full";

export type PaymentPolicy = {
  payInFullOnly: boolean;
  allowsChoice: boolean;
  depositCents: number;
  fullCents: number;
  balanceAfterDeposit: number;
  reason: string;
};

export function getPaymentPolicy(
  items: CartItem[],
  totalCents: number,
  settings: { depositPercent: number; fullPaymentThresholdCents: number }
): PaymentPolicy {
  const semiCustom = hasSemiCustom(items);
  const depositCents = calculateDeposit(totalCents, settings.depositPercent);
  const balanceAfterDeposit = totalCents - depositCents;

  const payInFullOnly = !semiCustom && totalCents < settings.fullPaymentThresholdCents;
  const allowsChoice = !payInFullOnly;

  let reason = "";
  if (payInFullOnly) {
    reason = "Small standard orders are paid in full at checkout.";
  } else if (semiCustom && totalCents >= settings.fullPaymentThresholdCents) {
    reason = "Custom items and larger orders can be paid as a deposit or in full now.";
  } else if (semiCustom) {
    reason = "Custom items require a deposit or you may pay in full now to skip a later balance.";
  } else {
    reason = "Orders over the full-payment threshold can be paid as a deposit or in full now.";
  }

  return {
    payInFullOnly,
    allowsChoice,
    depositCents,
    fullCents: totalCents,
    balanceAfterDeposit,
    reason,
  };
}

export function resolveCheckoutPayment(
  choice: PaymentChoice,
  policy: PaymentPolicy
): { chargeCents: number; paidInFull: boolean; balanceDueCents: number; depositCents: number } {
  if (policy.payInFullOnly || choice === "full") {
    return {
      chargeCents: policy.fullCents,
      paidInFull: true,
      balanceDueCents: 0,
      depositCents: policy.fullCents,
    };
  }

  return {
    chargeCents: policy.depositCents,
    paidInFull: false,
    balanceDueCents: policy.balanceAfterDeposit,
    depositCents: policy.depositCents,
  };
}
