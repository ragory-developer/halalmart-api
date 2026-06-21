import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { asyncHandler, slugify } from '../utils/helpers';
import { BaseController } from './BaseController';

const normalizeJsonField = (val: any): string | null => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return val;
};

export class CategoryController extends BaseController {
  /** Get all categories (with optional tree structure) */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
      include: { children: true, _count: { select: { products: true } } },
      where: { 
        parentId: null, 
        name: req.query.search ? { contains: req.query.search as string } : undefined 
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  });

  /** Get all category slugs (for ISR) */
  getSlugs = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
      select: { slug: true }
    });
    res.json({ success: true, data: categories.map(c => c.slug) });
  });

  /** Get single category by slug */
  getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug as string },
      include: { children: true, _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundError('Category not found');
    res.json({ success: true, data: category });
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, image, parentId, content, seoData } = req.body;
    const slug = slugify(name as string);
    const category = await prisma.category.create({
      data: { 
        name: name as string, 
        slug, 
        image: image as string, 
        parentId: parentId as string,
        content: content as string,
        seoData: normalizeJsonField(seoData)
      } as any,
    });
    res.status(201).json({ success: true, data: category });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, image, parentId, content, seoData } = req.body;
    
    // Build update object only with provided/valid fields
    const data: any = {};
    
    if (name) {
      data.name = name;
      data.slug = slugify(name);
    }
    
    // Explicitly allow null if coming from frontend as null or empty string
    data.image = image === undefined ? undefined : image;
    data.parentId = parentId === "" || parentId === null ? null : (parentId === undefined ? undefined : parentId);
    data.content = content === undefined ? undefined : content;
    data.seoData = seoData !== undefined ? normalizeJsonField(seoData) : undefined;

    try {
      logger.debug(`Updating Category ${req.params.id}`, { data });
      
      const category = await prisma.category.update({
        where: { id: req.params.id as string },
        data,
      });
      
      logger.info(`Category ${req.params.id} updated successfully`);
      res.json({ success: true, data: category });
    } catch (error) {
      logger.error(`Prisma Category Update Error for ${req.params.id}`, error);
      res.status(500).json({ 
        success: false, 
        message: "Database error during category update. Please check if fields are valid." 
      });
    }
  });

  /** Admin: delete a category */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.category.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Category deleted successfully' });
  });
}
