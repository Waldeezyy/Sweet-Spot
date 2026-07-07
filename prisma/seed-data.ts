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
};

const products: ProductSeed[] = [
  { name: "Basic Quarter Sheet Cake", slug: "basic-quarter-sheet-cake", description: "Basic Quarter sheet cake. Frosted in either white Buttercream or Whipped and your choice of writing on top.", basePriceCents: 5000, categorySlug: "sheet-cakes", sortOrder: 1, orderType: "STANDARD" },
  { name: "Custom Quarter Sheet Cake", slug: "custom-quarter-sheet-cake", description: "Price varies from $60-$80 depending on design and detail. Customer chooses color, type of frosting, and design.", basePriceCents: 6000, isStartingPrice: true, orderType: "SEMI_CUSTOM", categorySlug: "sheet-cakes", sortOrder: 2 },
  { name: "Basic Half Sheet", slug: "basic-half-sheet", description: "Basic Half Sheet Cake frosted with either buttercream or whipped frosting and your choice of writing on top.", basePriceCents: 8000, categorySlug: "sheet-cakes", sortOrder: 3, orderType: "STANDARD" },
  { name: "Custom Half Sheet Cake", slug: "custom-half-sheet-cake", description: "Custom half sheet with your choice of colors, frosting, and design. Price varies by complexity.", basePriceCents: 9500, isStartingPrice: true, orderType: "SEMI_CUSTOM", categorySlug: "sheet-cakes", sortOrder: 4 },
  { name: "Basic 6-10 inch Round Cakes", slug: "basic-round-cakes", description: "Round cakes in 6, 8, or 10 inch sizes. Frosted with buttercream or whipped and your choice of writing.", basePriceCents: 4000, isStartingPrice: true, categorySlug: "round-cakes", sortOrder: 5, orderType: "STANDARD" },
  { name: "Custom 6-10 inch Round Cake", slug: "custom-round-cake", description: "6 inch - $50-$65, 8 inch - $65-$85, 10 inch - $85-$110. Customer chooses frosting type, color/theme, and flavor. Filling between layers adds $10.", basePriceCents: 5000, isStartingPrice: true, orderType: "SEMI_CUSTOM", categorySlug: "round-cakes", sortOrder: 6 },
  { name: "Standard Cupcakes", slug: "standard-cupcakes", description: "Standard flavors: Vanilla, Chocolate, Marble. Frosted with either Vanilla Buttercream or whipped.", basePriceCents: 2500, categorySlug: "cupcakes", sortOrder: 7, orderType: "STANDARD" },
  { name: "Specialty Cupcakes", slug: "specialty-cupcakes", description: "Premium flavors and specialty designs. Starting price for a dozen.", basePriceCents: 3000, isStartingPrice: true, categorySlug: "cupcakes", sortOrder: 8, orderType: "SEMI_CUSTOM" },
  { name: "Custom Cupcakes", slug: "custom-cupcakes", description: "Fully custom cupcake designs with your choice of colors, themes, and flavors.", basePriceCents: 3500, isStartingPrice: true, orderType: "SEMI_CUSTOM", categorySlug: "cupcakes", sortOrder: 9 },
  { name: "Small Party Package", slug: "small-party-package", description: "2 dozen of any one treat type. Limit of 2 colors. Simple theme.", basePriceCents: 5500, categorySlug: "party-packages", sortOrder: 10, orderType: "STANDARD" },
  { name: "Medium Party Package", slug: "medium-party-package", description: "Perfect for medium gatherings. Multiple treat options with coordinated theme.", basePriceCents: 11000, categorySlug: "party-packages", sortOrder: 11, orderType: "STANDARD" },
  { name: "Large Party Package", slug: "large-party-package", description: "Large event package with variety of treats and custom theme options.", basePriceCents: 16000, categorySlug: "party-packages", sortOrder: 12, orderType: "STANDARD" },
  { name: "Your Party Package", slug: "your-party-package", description: "Prices vary depending on quantity, colors/themes, designs and decor. Limited to 3 colors per order. Any treat type.", basePriceCents: 18000, isStartingPrice: true, orderType: "SEMI_CUSTOM", categorySlug: "party-packages", sortOrder: 13 },
  { name: "Mini Cake (5.5oz foil loaf pan)", slug: "mini-cake", description: "Single-serve mini cakes in foil loaf pans. Perfect for game nights and individual treats.", basePriceCents: 2500, isStartingPrice: true, categorySlug: "mini-cakes", sortOrder: 14, orderType: "STANDARD" },
  { name: "Basic Cake Cookies", slug: "basic-cake-cookies", description: "Delicious cake-style cookies in classic flavors.", basePriceCents: 2000, categorySlug: "cookies", sortOrder: 15, orderType: "STANDARD" },
  { name: "Premium Cake Cookies", slug: "premium-cake-cookies", description: "Any flavor, any toppings. Premium decorated cake cookies.", basePriceCents: 4000, categorySlug: "cookies", sortOrder: 16, orderType: "STANDARD" },
];

const categories = [
  { name: "Sheet Cakes", slug: "sheet-cakes", sortOrder: 1 },
  { name: "Round Cakes", slug: "round-cakes", sortOrder: 2 },
  { name: "Cupcakes", slug: "cupcakes", sortOrder: 3 },
  { name: "Party Packages", slug: "party-packages", sortOrder: 4 },
  { name: "Mini Cakes", slug: "mini-cakes", sortOrder: 5 },
  { name: "Cake Cookies", slug: "cookies", sortOrder: 6 },
];

export async function seedDatabase() {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log("Database already seeded, skipping.");
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
      },
    });
  }

  for (let i = 0; i < flavors.length; i++) {
    await prisma.flavorOption.create({ data: { name: flavors[i], sortOrder: i } });
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
      leadTimeDays: 2,
      deliveryRadiusMiles: 12,
      pickupInstructions: "Pick up orders must be picked up no later than noon on the scheduled pick up day.",
      deliveryNote: "Delivery only within 12 mile radius (delivery fee may apply).",
      allergyNote: "If in need of gluten free or any other allergy, please note that in the comment section of your order.",
    },
  });

  console.log("Database seeded successfully.");
}
