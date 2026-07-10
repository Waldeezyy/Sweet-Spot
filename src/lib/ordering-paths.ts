export const ORDERING_PATHS = {
  menu: {
    href: "/menu",
    title: "Order from Our Menu",
    description:
      "Browse cupcakes, cakes, and party packages. Add items to your cart and check out online. Some customizable menu items are quoted before you pay.",
    buttonLabel: "Browse Menu",
  },
  custom: {
    href: "/custom-order",
    title: "Request a Custom Quote",
    description:
      "Wedding cakes, themed designs, or something not on our menu. Tell us your vision and Brandy will review the request and provide a quote — no charge until you approve.",
    buttonLabel: "Request a Custom Quote",
    bannerPrompt: "Don't see what you need?",
    bannerLinkLabel: "Request a custom quote",
  },
  checkout: {
    href: "/order",
    title: "Checkout",
    emptyCartMenuPrompt: "Browse the menu to add items to your cart.",
    emptyCartCustomPrompt: "Need something fully custom?",
    emptyCartCustomLink: "Request a quote",
  },
  crossLinks: {
    menuFromCustom: "Looking for items on our menu?",
    menuFromCustomLink: "Browse the menu instead",
    customFromCheckout: "Need something fully custom?",
    customFromCheckoutLink: "Request a quote",
    newOrderFromTrack: "Place a new order",
  },
} as const;
