import { z } from 'zod';

const sectionSchemas: Record<string, z.ZodTypeAny> = {}; // Deprecated: Moving to dynamic frontend registry

const unsafePattern = /<\s*script|javascript:|on\w+\s*=/i;

function assertNoUnsafeStrings(value: unknown, path = 'document') {
  if (typeof value === 'string') {
    if (unsafePattern.test(value)) {
      throw new Error(`Unsafe content is not allowed at ${path}`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUnsafeStrings(item, `${path}[${index}]`));
    return;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => assertNoUnsafeStrings(item, `${path}.${key}`));
  }
}

// Moving away from specific inline styles to Tailwind CSS Utility Classes stored as variants
export const builderSectionStyleSchema = z.object({
  className: z.string().max(500).optional(),
  cssVars: z.record(z.string()).optional(),
  // Keep legacy fields optional for backwards compatibility during migration
  spacingTop: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
  spacingBottom: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
  background: z.enum(["white", "gray", "brand", "dark"]).optional(),
  container: z.enum(["full", "contained", "narrow"]).optional(),
  customClass: z.string().max(250).optional(),
  customBgColor: z.string().max(80).optional(),
  customBgImage: z.string().max(1000).optional(),
  customTextColor: z.string().max(80).optional(),
  customPadding: z.string().max(100).optional(),
  customAlignment: z.enum(["left", "center", "right"]).optional(),
  bgColor: z.string().max(250).optional(),
  bgGradient: z.string().max(500).optional(),
  bgImage: z.string().max(1000).optional(),
  bgOverlay: z.number().min(0).max(100).optional(),
  textColor: z.string().max(250).optional(),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "full"]).optional(),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
}).passthrough();

export const builderSectionSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.string().min(1).max(80),
  variant: z.string().min(1).max(80).optional(),
  props: z.record(z.unknown()).default({}),
  styles: builderSectionStyleSchema.optional(),
  settings: z.object({
    hidden: z.boolean().optional(),
    container: z.enum(['full', 'contained']).optional(),
  }).optional(),
});

export const builderDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  page: z.object({
    key: z.string().min(1).max(80),
    slug: z.string().min(1).max(191),
    title: z.string().min(1).max(191),
    theme: z.string().max(80).nullish(),
  }),
  sections: z.array(builderSectionSchema).max(80),
  seo: z.object({
    title: z.string().max(191).optional(),
    description: z.string().max(500).optional(),
  }).optional(),
});

export type BuilderDocument = z.infer<typeof builderDocumentSchema>;

export function validateBuilderDocument(input: unknown): BuilderDocument {
  const document = builderDocumentSchema.parse(input);
  const ids = new Set<string>();

  document.sections.forEach((section, index) => {
    if (ids.has(section.id)) {
      throw new Error(`Duplicate section id: ${section.id}`);
    }
    ids.add(section.id);

    // Instead of failing if a component isn't in a hardcoded list, we allow dynamic components.
    // The frontend UI registry handles strict prop validation for rendering.
    // We just ensure it's a valid record.
    z.record(z.unknown()).parse(section.props || {});
  });

  assertNoUnsafeStrings(document);
  return document;
}

export function createDefaultHomeDocument(): BuilderDocument {
  return {
    schemaVersion: 1,
    page: { key: "home", slug: "/", title: "Home" },
    sections: [
      {
        id: "hero_1",
        type: "HeroBanner",
        variant: "default",
        props: {
          title: "Discover Natural Beauty",
          subtitle: "Premium skincare for your daily routine",
          ctaText: "Shop Now",
          ctaHref: "/products",
          imageSrc: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
          textAlign: "left",
        },
      },
      { id: "promo_badges_1", type: "PromoBadgeGrid", variant: "default", props: {} },
      {
        id: "product_showcase_1",
        type: "ProductShowcase",
        variant: "default",
        props: {
          title: "Shop by Category",
          subtitle: "Browse our curated collection of premium products",
          showcaseCategoryId: "all",
          textAlign: "left",
        },
      },
    ],
  };
}

