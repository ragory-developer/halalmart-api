import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { asyncHandler, parsePagination, slugify } from '../utils/helpers';
import { BaseController } from './BaseController';

const normalizeJsonField = (val: any): string | null => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return val;
};

export class BrandController extends BaseController {
  /** Get all brands */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query as any);
    const { search } = req.query;

    const where: any = {};
    if (search) {
      where.name = { contains: search as string };
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.brand.count({ where }),
    ]);

    res.json({
      success: true,
      data: brands,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  /** Get all brand slugs (for ISR) */
  getSlugs = asyncHandler(async (_req: Request, res: Response) => {
    const brands = await prisma.brand.findMany({
      select: { slug: true }
    });
    res.json({ success: true, data: brands.map(b => b.slug) });
  });

  /** Get single brand by slug */
  getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const brand = await prisma.brand.findUnique({
      where: { slug: req.params.slug as string },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) throw new NotFoundError('Brand not found');
    res.json({ success: true, data: brand });
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, logo, content, seoData } = req.body;
    const slug = slugify(name as string);
    const brand = await prisma.brand.create({
      data: { 
        name: name as string, 
        slug, 
        logo: logo as string,
        content: content as string,
        seoData: normalizeJsonField(seoData)
      } as any,
    });
    res.status(201).json({ success: true, data: brand });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, logo, content, seoData } = req.body;
    
    const data: any = {};
    
    if (name) {
      data.name = name;
      data.slug = slugify(name);
    }
    
    data.logo = logo === undefined ? undefined : logo;
    data.content = content === undefined ? undefined : content;
    data.seoData = seoData !== undefined ? normalizeJsonField(seoData) : undefined;

    try {
      const brand = await prisma.brand.update({
        where: { id: req.params.id as string },
        data,
      });
      
      logger.info(`Brand ${req.params.id} updated successfully`);
      res.json({ success: true, data: brand });
    } catch (error) {
      logger.error(`Prisma Brand Update Error for ${req.params.id}`, error);
      res.status(500).json({ 
        success: false, 
        message: "Database error during brand update. Please check if fields are valid." 
      });
    }
  });

  /** Admin: delete a brand */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.brand.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Brand deleted successfully' });
  });
}
