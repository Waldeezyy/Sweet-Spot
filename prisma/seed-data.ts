import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const galleryImages = [
  "https://static-production.bakesy.app/w9g51k3fx0639fyrdvj0scaj1q68",
  "https://static-production.bakesy.app/3qcx93dwxbqe55h3dgxfq0wsnaw4",
  "https://static-production.bakesy.app/cwa65t6ymals2jt357mv0hcsbpw4",
  "https://static-production.bakesy.app/448d22z46ye65uyr86zuixv3s0d3",
  "https://static-production.bakesy.app/fqugbtg0sfrawmxumjlg3408iui0",
  "https://static-production.bakesy.app/qzed70gmbke01p7rh9ql9fdl6bj3",
  "https://static-production.bakesy.app/mdzkjlj2s67tyg5a2v2inudg2dv3",
  "https://static-production.bakesy.app/k178fx1ipf9z0dnuqamfko2y3f18",
  "https://static-production.bakesy.app/0y2v5by1hx5gp3ada9f5y16z85sb",
  "https://static-production.bakesy.app/qk9x7l4pvxi979wq8f92aax2gzni",
  "https://static-production.bakesy.app/fpvuezf8ortgp59gau21oebxkelw",
  "https://static-production.bakesy.app/1632uvr3ijqlqul0ppqrov8eo1op",
  "https://static-production.bakesy.app/lj65khi5mqrndw7sbjr91205bxrn",
  "https://static-production.bakesy.app/xdezzx6y9nyfe5oius5ryusgyf4x",
  "https://static-production.bakesy.app/daxcdtyjkrxzrvp27ct2l728b95i",
  "https://static-production.bakesy.app/kzo9io26bdz20kov7t7d5suy8u8z",
  "https://static-production.bakesy.app/v702rmzupt44y7qyvzlxv7n9nrm0",
  "https://static-production.bakesy.app/unwck32wulkfoeww6k5y0ych6sqn",
];

const reviews = [
  { author: "Ally McPhee", rating: 5, itemName: "My sons 2nd birthday cake", text: "Absolutely was in love with the design that she created, I gave her examples of what I wanted and the theme. It was very last minute and what she created was astonishing. Will never go to another baker again. Everybody at the party loved it as well! I had the cake delivered and she was on time with no issues along the way whatsoever!", createdAt: new Date("2026-05-01") },
  { author: "Taylor", rating: 5, itemName: "Outstanding", text: "Cakes were absolutely delicious", createdAt: new Date("2025-07-01") },
  { author: "Heather Schmidt", rating: 5, itemName: "Reese's cake", text: "Absolutely mouthwatering! Can't wait to try more flavors 🙌🎉🧁", createdAt: new Date("2025-07-01") },
  { author: "Angel C.", rating: 5, itemName: "These desserts hit the spot!", text: "I grabbed a chocolate brownie and a strawberry cheesecake yesterday - both were seriously good. You can tell they're homemade with care. The girl behind them is really friendly and easy to deal with, which made the whole thing even better. I'll for sure be ordering again for my next event. 100% recommend. Don't sleep on these desserts - they're on another level!", createdAt: new Date("2025-07-01") },
  { author: "Suzanne Trim", rating: 5, itemName: "Strawberry cake", text: "Oh MY GOSH!!!! Absolutely DELICIOUS!!!! Great summer dish. Taking a large cake to a picnic.", createdAt: new Date("2025-07-01") },
  { author: "Taloni", rating: 5, itemName: "Yummy", text: "They was delicious . The mini deserts was moist n tasteful. My favorite was the banana pudding.", createdAt: new Date("2025-07-01") },
  { author: "Frankie Alvarez", rating: 5, itemName: "Them damn cakes were so damn good", text: "🔥 Definitely going to order more!", createdAt: new Date("2025-07-01") },
  { author: "Sara J", rating: 5, itemName: "Strawberry cake", text: "I tried the strawberry cake , was super moist, very tasty , a must try!!", createdAt: new Date("2025-07-01") },
  { author: "Mary", rating: 5, itemName: "For cakes", text: "They are so good will be getting more", createdAt: new Date("2025-07-01") },
  { author: "Marre", rating: 5, itemName: "Cake", text: "10/10 Must Try Again", createdAt: new Date("2025-07-01") },
  { author: "Sandra", rating: 5, itemName: "Mini cakes", text: "I got 3 cakes and they were delicious!", createdAt: new Date("2025-07-01") },
  { author: "Dawn", rating: 5, itemName: "Yummy", text: "I have purchased a couple of cakes from Brandy and loved them.", createdAt: new Date("2025-07-01") },
  { author: "Debbie", rating: 5, itemName: "Cakes", text: "Cakes are absolutely amazing! Moist and full of flavor. Love the variety of choices!", createdAt: new Date("2025-07-01") },
  { author: "Nikki", rating: 5, itemName: "Cakes", text: "Cakes are super moist, I've had almost every kind now. Never disappointed. Looking forward to trying the Gluten free ones.", createdAt: new Date("2025-07-01") },
  { author: "Jake", rating: 5, itemName: "Great cakes!", text: "These cakes are phenomenal. Each one tastes amazing and are made fresh! My favorite are the smaller, single serve dishes! Apple Pie and Fudge Brownie are my fav!", createdAt: new Date("2025-07-01") },
  { author: "Jenniee", rating: 5, itemName: "Great", text: "Cakes were delicious", createdAt: new Date("2025-07-01") },
  { author: "Mel S.", rating: 5, itemName: "Mini Cakes", text: "B's sweet spot really came through for my family and i with her mini cakes ! it was a great addition to our family game night. each cake has just the right amount for a single person serving. the flavor was AMAZING . can't wait to order more!", createdAt: new Date("2025-07-01") },
];

const flavors = [
  "Vanilla", "Chocolate", "Lemon", "Yellow", "Strawberry", "Spice", "Oreo",
  "Butter pecan", "Peach", "Blueberry", "Banana pudding", "Apple pie",
  "Pineapple", "Red Velvet", "Marble", "Funfetti",
];

const toppings = [
  "Strawberries", "Peaches", "Blueberries", "Pecans", "Oreos",
  "Caramelized apples", "Chocolate shaving", "Lemons",
];

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  basePriceCents: number;
  isStartingPrice?: boolean;
  orderType?: "STANDARD" | "SEMI_CUSTOM";
  categorySlug: string;
  sortOrder: number;
  allowFlavor?: boolean;
  allowTopping?: boolean;
  allowFrosting?: boolean;
  allowWriting?: boolean;
  maxFlavorOptions?: number;
  piecesPerOrderUnit?: number;
};

const PARTY_NO_CAKE_OPTIONS = {
  allowFlavor: false,
  allowTopping: false,
  allowFrosting: false,
  allowWriting: false,
} as const;

const PARTY_PRODUCT_PATCHES: Record<string, { name?: string; description: string }> = {
  "small-party-package": {
    description: "2 dozen treats. Choose 1 treat type. Simple theme colors (max 2 colors).",
  },
  "medium-party-package": {
    description: "4 dozen treats. Up to 2 treat types. Themed & basic decor included.",
  },
  "large-party-package": {
    description: "6 dozen treats. Up to 3 treat types. Full theme & detailed decor included.",
  },
  "your-party-package": {
    name: "Create Your Own Party Pack!",
    description:
      "Starting at $180. Custom designs & decals. Mix & match any treat type — Oreos, Rice Krispies, Cake Pops, Pretzels, Wafer Cookies, Marshmallows, Strawberries & more! Limited to 3 colors per order.",
  },
};

const products: ProductSeed[] = [
  { name: "Basic Quarter Sheet Cake", slug: "basic-quarter-sheet-cake", description: "Quarter sheet (serves 20–25). Buttercream or whipped finish with your choice of writing on top. $50.", basePriceCents: 5000, categorySlug: "sheet-cakes", sortOrder: 1, orderType: "STANDARD" },
  { name: "Custom Quarter Sheet Cake", slug: "custom-quarter-sheet-cake", description: "Quarter sheet (serves 20–25). Your choice of colors, frosting, and design. Starting at $65 — final price $65–$80 depending on detail.", basePriceCents: 6500, isStartingPrice: true, orderType: "SEMI_CUSTOM", categorySlug: "sheet-cakes", sortOrder: 2 },
  { name: "Basic Half Sheet", slug: "basic-half-sheet", description: "Half sheet (serves 40–50). Buttercream or whipped finish with your choice of writing on top. $80.", basePriceCents: 8000, categorySlug: "sheet-cakes", sortOrder: 3, orderType: "STANDARD" },
  { name: "Custom Half Sheet Cake", slug: "custom-half-sheet-cake", description: "Half sheet (serves 40–50). Your choice of colors, frosting, and design. Starting at $95 — final price $95–$120 depending on detail.", basePriceCents: 9500, isStartingPrice: true, orderType: "SEMI_CUSTOM", categorySlug: "sheet-cakes", sortOrder: 4 },
  { name: "Basic 6-10 inch Round Cakes", slug: "basic-round-cakes", description: "Buttercream finish round cakes. 6\" serves 8–12 ($40) · 8\" serves 15–20 ($55) · 10\" serves 25–30 ($70). Choose size when ordering.", basePriceCents: 4000, isStartingPrice: true, categorySlug: "round-cakes", sortOrder: 5, orderType: "STANDARD" },
  { name: "Custom 6-10 inch Round Cake", slug: "custom-round-cake", description: "Custom buttercream round cakes. 6\" from $50 ($50–$65) · 8\" from $65 ($65–$85) · 10\" from $85 ($85–$110). Choose size, colors, theme, and flavor when ordering.", basePriceCents: 5000, isStartingPrice: true, orderType: "SEMI_CUSTOM", categorySlug: "round-cakes", sortOrder: 6 },
  { name: "Standard Cupcakes", slug: "standard-cupcakes", description: "Vanilla, Chocolate, or Marble. Frosted with vanilla buttercream or whipped. 1 dozen $25 · 2 dozen $45.", basePriceCents: 2500, categorySlug: "cupcakes", sortOrder: 7, orderType: "STANDARD" },
  { name: "Specialty Cupcakes", slug: "specialty-cupcakes", description: "Strawberry, Red Velvet, Lemon, and more specialty flavors. 1 dozen $30 · 2 dozen $55.", basePriceCents: 3000, categorySlug: "cupcakes", sortOrder: 8, orderType: "STANDARD" },
  { name: "Custom Cupcakes", slug: "custom-cupcakes", description: "Themed cupcakes with your choice of colors, toppers, and designs. Starting at $35/dozen ($35–$45 depending on detail). 2 dozen from $70.", basePriceCents: 3500, isStartingPrice: true, orderType: "SEMI_CUSTOM", categorySlug: "cupcakes", sortOrder: 9 },
  { name: "Small Party Package", slug: "small-party-package", description: PARTY_PRODUCT_PATCHES["small-party-package"].description, basePriceCents: 5500, categorySlug: "party-packages", sortOrder: 10, orderType: "STANDARD", ...PARTY_NO_CAKE_OPTIONS },
  { name: "Medium Party Package", slug: "medium-party-package", description: PARTY_PRODUCT_PATCHES["medium-party-package"].description, basePriceCents: 11000, categorySlug: "party-packages", sortOrder: 11, orderType: "STANDARD", ...PARTY_NO_CAKE_OPTIONS },
  { name: "Large Party Package", slug: "large-party-package", description: PARTY_PRODUCT_PATCHES["large-party-package"].description, basePriceCents: 16000, categorySlug: "party-packages", sortOrder: 12, orderType: "STANDARD", ...PARTY_NO_CAKE_OPTIONS },
  { name: "Create Your Own Party Pack!", slug: "your-party-package", description: PARTY_PRODUCT_PATCHES["your-party-package"].description, basePriceCents: 18000, isStartingPrice: true, orderType: "SEMI_CUSTOM", categorySlug: "party-packages", sortOrder: 13, ...PARTY_NO_CAKE_OPTIONS },
  { name: "Mini Cake (5.5oz foil loaf pan)", slug: "mini-cake", description: "Single-serve mini cakes in foil loaf pans. Perfect for game nights and individual treats.", basePriceCents: 2500, isStartingPrice: true, categorySlug: "mini-cakes", sortOrder: 14, orderType: "STANDARD" },
  { name: "Basic Cake Cookies", slug: "basic-cake-cookies", description: "Delicious cake-style cookies in classic flavors.", basePriceCents: 2000, categorySlug: "cookies", sortOrder: 15, orderType: "STANDARD", maxFlavorOptions: 2, piecesPerOrderUnit: 12 },
  { name: "Premium Cake Cookies", slug: "premium-cake-cookies", description: "Any flavor, any toppings. Premium decorated cake cookies.", basePriceCents: 4000, categorySlug: "cookies", sortOrder: 16, orderType: "STANDARD" },
];

const categories: { name: string; slug: string; sortOrder: number; formType: "SIMPLE" | "CUPCAKE" | "ROUND_CAKE" | "SHEET_CAKE" | "PARTY_PACKAGE" }[] = [
  { name: "Sheet Cakes", slug: "sheet-cakes", sortOrder: 1, formType: "SHEET_CAKE" },
  { name: "Round Cakes", slug: "round-cakes", sortOrder: 2, formType: "ROUND_CAKE" },
  { name: "Cupcakes", slug: "cupcakes", sortOrder: 3, formType: "CUPCAKE" },
  { name: "Party Packages", slug: "party-packages", sortOrder: 4, formType: "PARTY_PACKAGE" },
  { name: "Mini Cakes", slug: "mini-cakes", sortOrder: 5, formType: "SIMPLE" },
  { name: "Cake Cookies", slug: "cookies", sortOrder: 6, formType: "SIMPLE" },
];

const STANDARD_FLAVORS = ["Vanilla", "Chocolate", "Marble"];
const SPECIALTY_FLAVORS = ["Strawberry", "Red Velvet", "Lemon", "Funfetti", "Oreo", "Peach", "Blueberry"];

const ADD_ON_SEED = [
  { slug: "filling", name: "Filling (strawberry, cream cheese, etc.)", priceCents: 750, priceLabel: "+$5–$10", sortOrder: 0 },
  { slug: "edible-image", name: "Edible image", priceCents: 1000, priceLabel: "+$10", sortOrder: 1 },
  { slug: "cake-topper", name: "Cake topper", priceCents: 1000, priceLabel: "+$5–$15", sortOrder: 2 },
  { slug: "extra-design", name: "Extra detailed design", priceCents: 1000, priceLabel: "+$10+", sortOrder: 3 },
];

const TREAT_TYPE_SEED = [
  "Oreos", "Rice Krispies", "Cake Pops", "Pretzels", "Wafer Cookies", "Marshmallows", "Strawberries", "Other (describe in notes)",
];

export async function seedDatabase() {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log("Database already seeded, skipping.");
    await ensurePartyPackageSettings();
    await ensureMenuCatalogPatches();
    return;
  }

  console.log("Seeding database...");

  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }

  const categoryMap = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id])
  );

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        basePriceCents: p.basePriceCents,
        isStartingPrice: p.isStartingPrice ?? false,
        orderType: p.orderType ?? "STANDARD",
        sortOrder: p.sortOrder,
        categoryId: categoryMap[p.categorySlug],
        allowFlavor: p.allowFlavor ?? true,
        allowTopping: p.allowTopping ?? true,
        allowFrosting: p.allowFrosting ?? true,
        allowWriting: p.allowWriting ?? true,
        maxFlavorOptions: p.maxFlavorOptions ?? 1,
        piecesPerOrderUnit: p.piecesPerOrderUnit ?? 1,
      },
    });
  }

  for (let i = 0; i < flavors.length; i++) {
    const name = flavors[i];
    let productSlugs: string[] = [];
    if (STANDARD_FLAVORS.includes(name)) productSlugs = ["standard-cupcakes"];
    else if (SPECIALTY_FLAVORS.includes(name)) productSlugs = ["specialty-cupcakes"];
    await prisma.flavorOption.create({ data: { name, sortOrder: i, productSlugs } });
  }

  const cakeCategorySlugs = ["round-cakes", "sheet-cakes"];
  for (const addOn of ADD_ON_SEED) {
    await prisma.addOnOption.create({
      data: { ...addOn, categorySlugs: cakeCategorySlugs },
    });
  }

  for (let i = 0; i < TREAT_TYPE_SEED.length; i++) {
    await prisma.treatTypeOption.create({
      data: { name: TREAT_TYPE_SEED[i], sortOrder: i, categorySlugs: ["party-packages"] },
    });
  }

  for (let i = 0; i < toppings.length; i++) {
    await prisma.toppingOption.create({ data: { name: toppings[i], sortOrder: i } });
  }

  for (let i = 0; i < galleryImages.length; i++) {
    await prisma.galleryImage.create({
      data: { url: galleryImages[i], sortOrder: i, isFeatured: i < 4 },
    });
  }

  for (const r of reviews) {
    await prisma.review.create({ data: r });
  }

  await prisma.shopSettings.create({
    data: {
      id: 1,
      businessName: "B's Sweet Spot",
      tagline: "Made with love in Dimondale, Michigan",
      aboutText: `Hi! My name is Brandy, I am the owner of B's Sweet Spot!

I pour my heart into every treat I make. As a mom who loves the outdoors, I find inspiration in nature's beauty and translate that beauty into each cake, crafted with love and meticulous detail. I'm passionate about making your special moments even sweeter, with a personal touch!

Ordering should be easy. But if you don't find what you are looking for, email me directly at bssweetstop25@gmail.com.

All cakes are made to order — fresh according to customer orders. Order in bulk for your next game night, family events and more.`,
      contactEmail: "bssweetstop25@gmail.com",
      location: "Dimondale, Michigan",
      orderMinimumCents: 2500,
      depositPercent: 25,
      fullPaymentThresholdCents: 7500,
      leadTimeDays: 2,
      deliveryRadiusMiles: 12,
      pickupInstructions: "Pick up orders must be picked up no later than noon on the scheduled pick up day.",
      deliveryNote: "Delivery only within 12 mile radius (delivery fee may apply).",
      allergyNote: "If in need of gluten free or any other allergy, please note that in the comment section of your order.",
    },
  });

  console.log("Database seeded successfully.");
  await ensurePartyPackageSettings();
  await ensureMenuCatalogPatches();
}

const CATEGORY_FORM_TYPES: Record<string, "SIMPLE" | "CUPCAKE" | "ROUND_CAKE" | "SHEET_CAKE" | "PARTY_PACKAGE"> = {
  "sheet-cakes": "SHEET_CAKE",
  "round-cakes": "ROUND_CAKE",
  cupcakes: "CUPCAKE",
  "party-packages": "PARTY_PACKAGE",
  "mini-cakes": "SIMPLE",
  cookies: "SIMPLE",
};

/** Patches categories, add-ons, treat types, flavor groups on every seed. */
export async function ensureMenuCatalogPatches() {
  for (const [slug, formType] of Object.entries(CATEGORY_FORM_TYPES)) {
    await prisma.category.updateMany({ where: { slug }, data: { formType } });
  }

  const cakeCategorySlugs = ["round-cakes", "sheet-cakes"];

  for (const addOn of ADD_ON_SEED) {
    await prisma.addOnOption.upsert({
      where: { slug: addOn.slug },
      create: { ...addOn, categorySlugs: cakeCategorySlugs },
      update: {
        name: addOn.name,
        priceCents: addOn.priceCents,
        priceLabel: addOn.priceLabel,
        sortOrder: addOn.sortOrder,
        categorySlugs: cakeCategorySlugs,
      },
    });
  }

  for (let i = 0; i < TREAT_TYPE_SEED.length; i++) {
    await prisma.treatTypeOption.upsert({
      where: { name: TREAT_TYPE_SEED[i] },
      create: { name: TREAT_TYPE_SEED[i], sortOrder: i, categorySlugs: ["party-packages"] },
      update: { sortOrder: i, categorySlugs: ["party-packages"] },
    });
  }

  for (const name of STANDARD_FLAVORS) {
    await prisma.flavorOption.updateMany({
      where: { name },
      data: { productSlugs: ["standard-cupcakes"], categorySlugs: [] },
    });
  }
  for (const name of SPECIALTY_FLAVORS) {
    await prisma.flavorOption.updateMany({
      where: { name },
      data: { productSlugs: ["specialty-cupcakes"], categorySlugs: [] },
    });
  }

  await prisma.flavorOption.updateMany({
    where: { flavorGroup: "standard" },
    data: { productSlugs: ["standard-cupcakes"], categorySlugs: [], flavorGroup: null },
  });
  await prisma.flavorOption.updateMany({
    where: { flavorGroup: "specialty" },
    data: { productSlugs: ["specialty-cupcakes"], categorySlugs: [], flavorGroup: null },
  });
}

/** Patches party package products on every seed — safe for existing databases. */
export async function ensurePartyPackageSettings() {
  for (const [slug, patch] of Object.entries(PARTY_PRODUCT_PATCHES)) {
    const result = await prisma.product.updateMany({
      where: { slug },
      data: {
        ...patch,
        ...PARTY_NO_CAKE_OPTIONS,
      },
    });
    if (result.count > 0) {
      console.log(`Updated party package: ${slug}`);
    }
  }
}
