export type ScopedOption = {
  categorySlugs: string[];
  productSlugs: string[];
};

export type CategoryWithProducts = {
  name: string;
  slug: string;
  products: { name: string; slug: string }[];
};

export function optionAppliesToProduct(
  option: ScopedOption,
  categorySlug: string,
  productSlug: string
): boolean {
  if (option.productSlugs.length > 0) {
    return option.productSlugs.includes(productSlug);
  }
  if (option.categorySlugs.length > 0) {
    return option.categorySlugs.includes(categorySlug);
  }
  return true;
}

export function formatScopeLabel(
  option: ScopedOption,
  categories: CategoryWithProducts[]
): string {
  if (option.productSlugs.length > 0) {
    const names = option.productSlugs.map((slug) => {
      for (const category of categories) {
        const product = category.products.find((p) => p.slug === slug);
        if (product) return product.name;
      }
      return slug;
    });
    return names.join(", ");
  }
  if (option.categorySlugs.length > 0) {
    return option.categorySlugs
      .map((slug) => categories.find((c) => c.slug === slug)?.name ?? slug)
      .join(", ");
  }
  return "All menu items";
}

export function normalizeScope(scope: ScopedOption): ScopedOption {
  if (scope.productSlugs.length > 0) {
    return { categorySlugs: [], productSlugs: [...new Set(scope.productSlugs)] };
  }
  return { categorySlugs: [...new Set(scope.categorySlugs)], productSlugs: [] };
}
