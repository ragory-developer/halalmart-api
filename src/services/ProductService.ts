import prisma from '../config/database';
import { slugify } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export const normalizeImages = (imgs: any): string => {
  if (!imgs) return '[]';
  
  let urls: string[] = [];
  
  if (Array.isArray(imgs)) {
    for (const item of imgs) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              urls.push(...parsed);
              continue;
            }
          } catch (e) {
            // Not valid JSON, treat as raw string
          }
        }
        urls.push(trimmed);
      } else if (item) {
        urls.push(String(item));
      }
    }
  } else if (typeof imgs === 'string') {
    const trimmed = imgs.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return JSON.stringify(parsed);
        }
      } catch (e) {
        // Not valid JSON, treat as single string
      }
    }
    if (trimmed) {
      urls.push(trimmed);
    }
  }
  
  return JSON.stringify(urls);
};

export const normalizeJsonField = (val: any): string | null => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return val;
};

export class ProductService {
  /**
   * Build the complex filtering 'where' clause for products
   */
  public buildFilterWhereClause(query: any): Prisma.ProductWhereInput {
    const { search, category, brand, minPrice, maxPrice, featured, hasPromotion } = query;
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
        { brand: { name: { contains: search as string } } },
        { categories: { some: { name: { contains: search as string } } } },
        { tags: { some: { name: { contains: search as string } } } },
        { variants: { some: { attributes: { some: { value: { contains: search as string } } } } } },
      ];
    }
    
    if (category) {
      const catSlugs = (category as string).split(',');
      where.categories = { some: { slug: { in: catSlugs } } };
    }
    
    if (brand) {
      const brandSlugs = (brand as string).split(',');
      where.brand = { slug: { in: brandSlugs } };
    }
    
    if (minPrice || maxPrice) {
      const minP = minPrice ? parseFloat(minPrice as string) : 0;
      const maxP = maxPrice ? parseFloat(maxPrice as string) : 999999999;
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { price: { gte: minP, lte: maxP } },
            { specialPrice: { gte: minP, lte: maxP } },
            {
              variants: {
                some: {
                  OR: [
                    { price: { gte: minP, lte: maxP } },
                    { specialPrice: { gte: minP, lte: maxP } }
                  ]
                }
              }
            }
          ]
        }
      ];
    }

    const attributes = query.attributes as string;
    if (attributes) {
      const andConditions: any[] = [];
      const attrsList = attributes.split('|');
      for (const group of attrsList) {
        const [attrNameEncoded, valuesCsv] = group.split(':');
        if (valuesCsv) {
          const attrName = decodeURIComponent(attrNameEncoded);
          const values = valuesCsv.split(',').map(decodeURIComponent);
          andConditions.push({
            variants: {
               some: {
                  attributes: {
                     some: {
                        name: attrName,
                        value: { in: values }
                     }
                  }
               }
            }
          });
        }
      }
      if (andConditions.length > 0) {
        where.AND = [ ...(where.AND || []), ...andConditions ];
      }
    }

    if (featured === 'true') where.featured = true;

    if (hasPromotion === 'true') {
      where.specialPrice = { not: null };
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { specialPriceEnd: null },
            { specialPriceEnd: { gte: new Date() } }
          ]
        }
      ];
    } else if (hasPromotion === 'false') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { specialPrice: null },
            { specialPriceEnd: { lt: new Date() } }
          ]
        }
      ];
    }
    
    return where;
  }

  /**
   * Get products with CURSOR-BASED or OFFSET-BASED pagination
   */
  public async getProducts(where: Prisma.ProductWhereInput, orderBy: any, cursor?: string, take: number = 20, skip: number = 0) {
    const queryArgs: Prisma.ProductFindManyArgs = {
      where,
      include: {
        categories: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { enabled: true },
          include: { attributes: true },
          orderBy: { isDefault: 'desc' },
        },
      },
      orderBy,
      take,
    };

    if (cursor) {
      queryArgs.cursor = { id: cursor };
      queryArgs.skip = 1; // Skip the cursor itself
    } else {
      queryArgs.skip = skip;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany(queryArgs),
      prisma.product.count({ where }),
    ]);

    // Compute price range for variable products
    const enriched = products.map((p: any) => ({
      ...p,
      priceRange: p.productType === 'VARIABLE' && p.variants.length > 0
        ? {
            min: Math.min(...p.variants.map((v: any) => v.price)),
            max: Math.max(...p.variants.map((v: any) => v.price)),
          }
        : null,
    }));

    const nextCursor = products.length === take ? products[products.length - 1].id : null;

    return { enriched, total, nextCursor };
  }
}

export const productService = new ProductService();
