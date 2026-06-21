import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { BaseController } from './BaseController';

const prisma = new PrismaClient();

export class ReviewController extends BaseController {
  // Fetch reviews for a specific product
  public getByProductId = async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { limit = 10, page = 1 } = req.query;

      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const reviews = await prisma.review.findMany({
        where: { productId: productId as string },
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      });

      const total = await prisma.review.count({ where: { productId: productId as string } });

      res.json({
        success: true,
        data: reviews,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  // Generic endpoint to fetch top reviews (e.g., for landing page)
  public getAll = async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;

      const reviews = await prisma.review.findMany({
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true } } }, // optionally include product info
      });

      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}
