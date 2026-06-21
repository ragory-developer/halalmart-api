import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { asyncHandler, parsePagination, slugify } from '../utils/helpers';
import { BaseController } from './BaseController';

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

export class ProductController extends BaseController {
  /** Get products with search, filter, and pagination */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query as any);
    const { search, category, brand, minPrice, maxPrice, sort, featured, hasPromotion, minRating, productType, stockStatus } = req.query;

    const where: any = {};
    if (search) {
      const searchTerms = (search as string).trim().split(/\s+/);
      const searchConditions = searchTerms.map(term => ({
        OR: [
          { name: { contains: term } },
          { brand: { name: { contains: term } } },
          { categories: { some: { name: { contains: term } } } },
          { tags: { some: { name: { contains: term } } } },
          { variants: { some: { attributes: { some: { value: { contains: term } } } } } },
          { variants: { some: { sku: { contains: term } } } }
        ]
      }));
      where.AND = [
        ...(where.AND || []),
        ...searchConditions
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
    const attributes = req.query.attributes as string;
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

    if (productType) {
      where.productType = productType;
    }

    if (stockStatus) {
      const stockConditions = [];
      if (stockStatus === 'IN_STOCK') {
        stockConditions.push({
          OR: [
            { AND: [{ productType: 'SIMPLE' }, { stock: { gt: 10 } }] },
            { AND: [{ productType: 'VARIABLE' }, { variants: { some: { stock: { gt: 10 } } } }] }
          ]
        });
      } else if (stockStatus === 'LOW_STOCK') {
        stockConditions.push({
          OR: [
            { AND: [{ productType: 'SIMPLE' }, { stock: { gt: 0, lte: 10 } }] },
            { AND: [{ productType: 'VARIABLE' }, { variants: { some: { stock: { gt: 0, lte: 10 } } } }] }
          ]
        });
      } else if (stockStatus === 'OUT_OF_STOCK') {
        stockConditions.push({
          OR: [
            { AND: [{ productType: 'SIMPLE' }, { stock: { lte: 0 } }] },
            { AND: [{ productType: 'VARIABLE' }, { variants: { every: { stock: { lte: 0 } } } }] }
          ]
        });
      }
      if (stockConditions.length > 0) {
        where.AND = [ ...(where.AND || []), ...stockConditions ];
      }
    }

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

    if (minRating) {
      const rating = parseFloat(minRating as string);
      if (!isNaN(rating)) {
        where.averageRating = { gte: rating };
      }
    }

    // Sort options
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'name') orderBy = { name: 'asc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          categories: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          tags: { select: { id: true, name: true, slug: true } },
          variants: {
            where: { enabled: true } as any,
            include: { attributes: true },
            orderBy: { isDefault: 'desc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Compute price range for variable products
    const enriched = (products as any[]).map((p: any) => ({
      ...p,
      priceRange: p.productType === 'VARIABLE' && p.variants.length > 0
        ? {
            min: Math.min(...p.variants.map((v: any) => v.price)),
            max: Math.max(...p.variants.map((v: any) => v.price)),
          }
        : null,
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  /** Get dynamic product filters and aggregations */
  getFilters = asyncHandler(async (req: Request, res: Response) => {
    const { search, category, brand, attributes, minPrice, maxPrice } = req.query;

    // 1. Build Base Where Clause
    const baseWhere: any = {};
    if (search) {
      const searchTerms = (search as string).trim().split(/\s+/);
      const searchConditions = searchTerms.map(term => ({
        OR: [
          { name: { contains: term } },
          { brand: { name: { contains: term } } },
          { categories: { some: { name: { contains: term } } } },
          { tags: { some: { name: { contains: term } } } },
          { variants: { some: { attributes: { some: { value: { contains: term } } } } } },
          { variants: { some: { sku: { contains: term } } } }
        ]
      }));
      baseWhere.AND = [
        ...(baseWhere.AND || []),
        ...searchConditions
      ];
    }

    if (category) {
      const catSlugs = (category as string).split(',');
      baseWhere.categories = { some: { slug: { in: catSlugs } } };
    }
    
    if (brand) {
      const brandSlugs = (brand as string).split(',');
      baseWhere.brand = { slug: { in: brandSlugs } };
    }

    if (minPrice || maxPrice) {
      const minP = minPrice ? parseFloat(minPrice as string) : 0;
      const maxP = maxPrice ? parseFloat(maxPrice as string) : 999999999;
      baseWhere.AND = [
        ...(baseWhere.AND || []),
        {
          OR: [
            { price: { gte: minP, lte: maxP } },
            { specialPrice: { gte: minP, lte: maxP } },
            { variants: { some: { OR: [ { price: { gte: minP, lte: maxP } }, { specialPrice: { gte: minP, lte: maxP } } ] } } }
          ]
        }
      ];
    }

    if (attributes) {
      const andConditions: any[] = [];
      const attrsList = (attributes as string).split('|');
      for (const group of attrsList) {
        const [attrNameEncoded, valuesCsv] = group.split(':');
        if (valuesCsv) {
          const attrName = decodeURIComponent(attrNameEncoded);
          const values = valuesCsv.split(',').map(decodeURIComponent);
          andConditions.push({
            variants: { some: { attributes: { some: { name: attrName, value: { in: values } } } } }
          });
        }
      }
      if (andConditions.length > 0) {
        baseWhere.AND = [ ...(baseWhere.AND || []), ...andConditions ];
      }
    }

    // 2. We need to query Products matching baseWhere to get counts.
    // For large catalogs, doing findMany with include is expensive. 
    // We will select only what we need.
    const products = await prisma.product.findMany({
      where: baseWhere,
      select: {
        id: true,
        price: true,
        specialPrice: true,
        brand: { select: { id: true, name: true, slug: true } },
        categories: { select: { id: true, name: true, slug: true } },
        variants: {
          select: {
            price: true,
            attributes: { select: { name: true, value: true } }
          }
        }
      }
    });

    // 3. Aggregate Data
    const brandMap = new Map<string, { id: string, name: string, slug: string, count: number }>();
    const categoryMap = new Map<string, { id: string, name: string, slug: string, count: number }>();
    const specMap = new Map<string, Map<string, number>>();
    let calcMinPrice = Infinity;
    let calcMaxPrice = -Infinity;

    for (const p of products) {
      // Prices
      let pMin = p.price;
      let pMax = p.price;
      if (p.specialPrice) pMin = Math.min(pMin, p.specialPrice);
      for (const v of p.variants) {
        pMin = Math.min(pMin, v.price);
        pMax = Math.max(pMax, v.price);
      }
      calcMinPrice = Math.min(calcMinPrice, pMin);
      calcMaxPrice = Math.max(calcMaxPrice, pMax);

      // Brands
      if (p.brand) {
        const b = p.brand;
        if (!brandMap.has(b.slug)) {
          brandMap.set(b.slug, { ...b, count: 0 });
        }
        brandMap.get(b.slug)!.count++;
      }

      // Categories
      for (const c of p.categories) {
        if (!categoryMap.has(c.slug)) {
          categoryMap.set(c.slug, { ...c, count: 0 });
        }
        categoryMap.get(c.slug)!.count++;
      }

      // Attributes
      for (const v of p.variants) {
        for (const attr of v.attributes) {
          if (!specMap.has(attr.name)) {
            specMap.set(attr.name, new Map<string, number>());
          }
          const valMap = specMap.get(attr.name)!;
          if (!valMap.has(attr.value)) {
            valMap.set(attr.value, 0);
          }
          // We increment attribute count (note: multiple variants might have the same value, we should ideally count distinct products, but for variants counting variant occurrences is acceptable for now, or we track unique products per attribute)
        }
      }
    }

    // Fix attribute counts to represent unique products per attribute value
    // To do this accurately, we should collect unique values per product first
    specMap.clear();
    for (const p of products) {
       const pAttrs = new Set<string>();
       for (const v of p.variants) {
         for (const attr of v.attributes) {
            pAttrs.add(`${attr.name}:::${attr.value}`);
         }
       }
       for (const a of pAttrs) {
          const [name, value] = a.split(':::');
          if (!specMap.has(name)) specMap.set(name, new Map<string, number>());
          const valMap = specMap.get(name)!;
          valMap.set(value, (valMap.get(value) || 0) + 1);
       }
    }

    // 4. Format Output
    const brands = Array.from(brandMap.values()).sort((a, b) => b.count - a.count);
    const categories = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);
    
    const specifications = Array.from(specMap.entries()).map(([name, valMap], idx) => ({
      id: `spec_${idx}`,
      name,
      values: Array.from(valMap.entries()).map(([value, count], vIdx) => ({
        id: `val_${idx}_${vIdx}`,
        value,
        count
      })).sort((a, b) => b.count - a.count)
    }));

    res.json({
      success: true,
      data: {
        priceRange: {
          min: calcMinPrice === Infinity ? 0 : calcMinPrice,
          max: calcMaxPrice === -Infinity ? 50000 : calcMaxPrice,
        },
        brands,
        categories,
        specifications
      }
    });
  });

  /** Check if a slug is available across ALL entities */
  checkSlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug, excludeId } = req.query;
    if (!slug) {
      res.json({ success: true, available: false });
      return;
    }
    
    const targetSlug = slug as string;
    const eId = excludeId as string;
    
    // Check all tables simultaneously
    const [prod, cat, brand, page] = await Promise.all([
      prisma.product.findFirst({ where: eId ? { slug: targetSlug, id: { not: eId } } : { slug: targetSlug } }),
      prisma.category.findFirst({ where: eId ? { slug: targetSlug, id: { not: eId } } : { slug: targetSlug } }),
      prisma.brand.findFirst({ where: eId ? { slug: targetSlug, id: { not: eId } } : { slug: targetSlug } }),
      prisma.page.findFirst({ where: eId ? { slug: targetSlug, id: { not: eId } } : { slug: targetSlug } }),
    ]);

    const existing = prod || cat || brand || page;
    res.json({ success: true, available: !existing });
  });

  /** Get all product slugs (for ISR) */
  getSlugs = asyncHandler(async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
      select: { slug: true }
    });
    res.json({ success: true, data: products.map(p => p.slug) });
  });

  /** Get a single product by slug */
  getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug as string },
      include: {
        categories: { 
          include: { 
            parent: { 
              include: { 
                parent: {
                  include: {
                    parent: true
                  }
                }
              }
            } 
          } 
        },
        brand: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
        variants: {
          include: { attributes: true },
          orderBy: { isDefault: 'desc' },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!product) throw new NotFoundError('Product not found');

    const p = product as any;

    // Price range from all enabled variants
    const enabledVariants = (p.variants as any[]).filter((v: any) => v.enabled);
    const priceRange = p.productType === 'VARIABLE' && enabledVariants.length > 0
      ? {
          min: Math.min(...enabledVariants.map((v: any) => v.price)),
          max: Math.max(...enabledVariants.map((v: any) => v.price)),
        }
      : null;

    // Query payload for product cards to support variable products price ranges
    const productCardSelect = {
      id: true,
      name: true,
      slug: true,
      price: true,
      specialPrice: true,
      specialPriceStart: true,
      specialPriceEnd: true,
      image: true,
      unit: true,
      productType: true,
      variants: {
        where: { enabled: true },
        select: { price: true, specialPrice: true, specialPriceStart: true, specialPriceEnd: true }
      }
    };

    // Get related products from same category
    const firstCategoryId = (p.categories as any[])[0]?.id;
    const related = firstCategoryId ? await prisma.product.findMany({
      where: { categories: { some: { id: firstCategoryId } }, id: { not: p.id } },
      take: 4,
      select: productCardSelect,
    }) : [];

    let resolvedUpsells: any[] = [];
    let parsedUpsellIds: string[] = [];
    if (typeof p.upsellProducts === 'string' && p.upsellProducts.startsWith('[')) {
      try { parsedUpsellIds = JSON.parse(p.upsellProducts); } catch(e) {}
    } else if (Array.isArray(p.upsellProducts)) {
      parsedUpsellIds = p.upsellProducts;
    }

    if (parsedUpsellIds.length > 0) {
      resolvedUpsells = await prisma.product.findMany({
        where: { id: { in: parsedUpsellIds } },
        select: productCardSelect,
        take: 8
      });
    } else {
      let parsedUpsellCats: string[] = [];
      if (typeof p.upsellCategoryIds === 'string' && p.upsellCategoryIds.startsWith('[')) {
        try { parsedUpsellCats = JSON.parse(p.upsellCategoryIds); } catch(e) {}
      } else if (Array.isArray(p.upsellCategoryIds)) {
        parsedUpsellCats = p.upsellCategoryIds;
      }

      if (parsedUpsellCats.length > 0) {
        resolvedUpsells = await prisma.product.findMany({
          where: { categories: { some: { id: { in: parsedUpsellCats } } }, id: { not: p.id } },
          select: productCardSelect,
          take: 8
        });
      }
    }

    let resolvedDownsells: any[] = [];
    let parsedDownsellIds: string[] = [];
    if (typeof p.downsellProducts === 'string' && p.downsellProducts.startsWith('[')) {
      try { parsedDownsellIds = JSON.parse(p.downsellProducts); } catch(e) {}
    } else if (Array.isArray(p.downsellProducts)) {
      parsedDownsellIds = p.downsellProducts;
    }

    if (parsedDownsellIds.length > 0) {
      resolvedDownsells = await prisma.product.findMany({
        where: { id: { in: parsedDownsellIds } },
        select: productCardSelect,
        take: 8
      });
    } else {
      let parsedDownsellCats: string[] = [];
      if (typeof p.downsellCategoryIds === 'string' && p.downsellCategoryIds.startsWith('[')) {
        try { parsedDownsellCats = JSON.parse(p.downsellCategoryIds); } catch(e) {}
      } else if (Array.isArray(p.downsellCategoryIds)) {
        parsedDownsellCats = p.downsellCategoryIds;
      }

      if (parsedDownsellCats.length > 0) {
        resolvedDownsells = await prisma.product.findMany({
          where: { categories: { some: { id: { in: parsedDownsellCats } } }, id: { not: p.id } },
          select: productCardSelect,
          take: 8
        });
      }
    }

    res.json({ success: true, data: { ...p, priceRange, related, resolvedUpsells, resolvedDownsells } });
  });

  /** Admin: create a product with variants */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      name, description, shortDescription, price, specialPrice, specialPriceStart, specialPriceEnd, stock, image, images,
      unit, weight, featured, categoryIds, brandId, variants, tags, specifications, faqs, slug: customSlug,
      upsellProducts, upsellCategoryIds, downsellProducts, downsellCategoryIds, seoData
    } = req.body;

    let baseSlug = customSlug ? slugify(customSlug) : slugify(name);
    let slug = baseSlug;
    
    if (customSlug) {
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        res.status(400).json({ success: false, message: 'The custom slug is already taken. Please choose another one.' });
        return;
      }
    } else {
      let counter = 1;
      while (await prisma.product.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
    const hasVariants = Array.isArray(variants) && variants.length > 0;

    const data: any = {
      name,
      slug,
      productType: hasVariants ? 'VARIABLE' : 'SIMPLE',
      description,
      shortDescription,
      price,
      specialPrice,
      specialPriceStart: specialPriceStart ? new Date(specialPriceStart) : null,
      specialPriceEnd: specialPriceEnd ? new Date(specialPriceEnd) : null,
      stock: hasVariants ? 0 : (stock ?? 0),
      image,
      images: normalizeImages(images),
      unit,
      weight,
      featured,
      brandId: brandId || null,
      upsellProducts: normalizeJsonField(upsellProducts),
      upsellCategoryIds: normalizeJsonField(upsellCategoryIds),
      downsellProducts: normalizeJsonField(downsellProducts),
      downsellCategoryIds: normalizeJsonField(downsellCategoryIds),
      specifications: normalizeJsonField(specifications),
      faqs: normalizeJsonField(faqs),
      seoData: normalizeJsonField(seoData),
      categories: categoryIds?.length ? { connect: categoryIds.map((id: string) => ({ id })) } : undefined,
      tags: tags?.length ? { connect: tags.map((id: string) => ({ id })) } : undefined,
      variants: hasVariants ? {
        create: variants.map((v: any, idx: number) => ({
          sku: v.sku || null,
          price: v.price ?? price,
          specialPrice: v.specialPrice ?? null,
          specialPriceStart: v.specialPriceStart ? new Date(v.specialPriceStart) : null,
          specialPriceEnd: v.specialPriceEnd ? new Date(v.specialPriceEnd) : null,
          stock: 0,
          image: v.image || null,
          isDefault: v.isDefault ?? idx === 0,
          enabled: v.enabled ?? true,
          attributes: v.attributes?.length ? {
            create: v.attributes.map((a: any) => ({
              name: a.name,
              value: a.value,
            })),
          } : undefined,
        })),
      } : undefined,
    };

    const product = await (prisma.product.create as any)({
      data,
      include: {
        categories: true,
        brand: true,
        variants: { include: { attributes: true } },
      },
    });

    res.status(201).json({ success: true, data: product });
  });

  /** Admin: update a product */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      name, description, shortDescription, price, specialPrice, specialPriceStart, specialPriceEnd, stock, image, images,
      unit, weight, featured, categoryIds, brandId, tags, productType, variants, slug: customSlug, specifications, faqs,
      upsellProducts, upsellCategoryIds, downsellProducts, downsellCategoryIds, seoData
    } = req.body;

    const data: any = {
      description, shortDescription, price, specialPrice,
      specialPriceStart: specialPriceStart ? new Date(specialPriceStart) : null,
      specialPriceEnd: specialPriceEnd ? new Date(specialPriceEnd) : null,
      stock, image,
      images: normalizeImages(images),
      unit, weight, featured, brandId,
      productType,
      upsellProducts: upsellProducts !== undefined ? normalizeJsonField(upsellProducts) : undefined,
      upsellCategoryIds: upsellCategoryIds !== undefined ? normalizeJsonField(upsellCategoryIds) : undefined,
      downsellProducts: downsellProducts !== undefined ? normalizeJsonField(downsellProducts) : undefined,
      downsellCategoryIds: downsellCategoryIds !== undefined ? normalizeJsonField(downsellCategoryIds) : undefined,
      specifications: specifications !== undefined ? normalizeJsonField(specifications) : undefined,
      faqs: faqs !== undefined ? normalizeJsonField(faqs) : undefined,
      categories: categoryIds ? { set: categoryIds.map((id: string) => ({ id })) } : undefined,
      tags: tags ? { set: tags.map((id: string) => ({ id })) } : undefined,
      seoData: seoData !== undefined ? normalizeJsonField(seoData) : undefined,
    };
    
    if (name || customSlug) {
      if (name) data.name = name;
      let baseSlug = customSlug ? slugify(customSlug) : slugify(name || req.body.name);
      let slug = baseSlug;
      
      if (customSlug) {
        const existing = await prisma.product.findFirst({ where: { slug, id: { not: req.params.id as string } } });
        if (existing) {
          res.status(400).json({ success: false, message: 'The custom slug is already taken. Please choose another one.' });
          return;
        }
      } else {
        let counter = 1;
        while (await prisma.product.findFirst({ where: { slug, id: { not: req.params.id as string } } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }
      data.slug = slug;
    }

    if (variants && Array.isArray(variants)) {
      const incomingIds = variants.map((v: any) => v.id).filter(Boolean);
      await prisma.productVariant.updateMany({
        where: { productId: req.params.id as string, id: { notIn: incomingIds } },
        data: { enabled: false }
      });

      data.variants = {
        upsert: variants.map((v: any, idx: number) => ({
          where: { id: v.id || 'new_placeholder_' + idx },
          update: {
            sku: v.sku || null,
            price: v.price ?? price,
            specialPrice: v.specialPrice ?? null,
            specialPriceStart: v.specialPriceStart ? new Date(v.specialPriceStart) : null,
            specialPriceEnd: v.specialPriceEnd ? new Date(v.specialPriceEnd) : null,
            image: v.image || null,
            isDefault: v.isDefault ?? idx === 0,
            enabled: v.enabled ?? true,
            attributes: {
              deleteMany: {},
              create: v.attributes?.map((a: any) => ({ name: a.name, value: a.value })) || []
            }
          },
          create: {
            sku: v.sku || null,
            price: v.price ?? price,
            specialPrice: v.specialPrice ?? null,
            specialPriceStart: v.specialPriceStart ? new Date(v.specialPriceStart) : null,
            specialPriceEnd: v.specialPriceEnd ? new Date(v.specialPriceEnd) : null,
            stock: 0,
            image: v.image || null,
            isDefault: v.isDefault ?? idx === 0,
            enabled: v.enabled ?? true,
            attributes: {
              create: v.attributes?.map((a: any) => ({ name: a.name, value: a.value })) || []
            }
          }
        }))
      };
    }

    const product = await (prisma.product.update as any)({
      where: { id: req.params.id },
      data,
      include: {
        categories: true,
        brand: true,
        variants: { include: { attributes: true } },
      },
    });
    res.json({ success: true, data: product, debugData: data });
  });

  /** Admin: delete a product */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      // Handle foreign key constraints for optional relations without cascade
      await prisma.orderItem.updateMany({
        where: { productId: id },
        data: { productId: null }
      });
      await prisma.cartItem.updateMany({
        where: { productId: id },
        data: { productId: null }
      });
      
      await prisma.product.delete({ where: { id } });
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error: any) {
      console.error("Delete Error:", error);
      res.status(500).json({ success: false, message: 'Failed to delete product. ' + (error.message || '') });
    }
  });

  /** Admin: delete multiple products */
  bulkDelete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ success: false, message: 'Please select at least one product.' });
      return;
    }
    
    try {
      await prisma.orderItem.updateMany({
        where: { productId: { in: productIds } },
        data: { productId: null }
      });
      await prisma.cartItem.updateMany({
        where: { productId: { in: productIds } },
        data: { productId: null }
      });

      await prisma.product.deleteMany({
        where: { id: { in: productIds } }
      });
      res.json({ success: true, message: 'Products deleted successfully' });
    } catch (error: any) {
      console.error("Bulk Delete Error:", error);
      res.status(500).json({ success: false, message: 'Failed to delete products. ' + (error.message || '') });
    }
  });

  /** Admin: Apply bulk promotion to multiple products */
  applyBulkPromotion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productIds, type, value, startDate, endDate, remove } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ success: false, message: 'Please select at least one product.' });
      return;
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true }
    });

    const transactionOps = [];

    for (const p of products) {
      let specialPrice = null;
      
      if (!remove) {
        if (type === 'PERCENT') {
          specialPrice = p.price - (p.price * value / 100);
        } else {
          specialPrice = Math.max(0, p.price - value);
        }
      }

      transactionOps.push(
        prisma.product.update({
          where: { id: p.id },
          data: {
            specialPrice,
            specialPriceStart: remove ? null : start,
            specialPriceEnd: remove ? null : end,
          }
        })
      );

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          let vSpecialPrice = null;
          if (!remove) {
             if (type === 'PERCENT') {
                vSpecialPrice = v.price - (v.price * value / 100);
             } else {
                vSpecialPrice = Math.max(0, v.price - value);
             }
          }

          transactionOps.push(
            prisma.productVariant.update({
              where: { id: v.id },
              data: {
                specialPrice: vSpecialPrice,
                specialPriceStart: remove ? null : start,
                specialPriceEnd: remove ? null : end,
              }
            })
          );
        }
      }
    }

    await prisma.$transaction(transactionOps);

    res.json({ success: true, message: remove ? 'Promotions removed successfully' : 'Bulk promotions applied successfully' });
  });
}
