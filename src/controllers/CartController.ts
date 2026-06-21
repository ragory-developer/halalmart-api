import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { CartService } from '../services/cartService';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { asyncHandler, getActivePrice } from '../utils/helpers';
import { getSettingBool } from '../utils/settings';
import { BaseController } from './BaseController';

const cartService = new CartService();

export class CartController extends BaseController {
  /** Get current user's cart with items */
  getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user!.userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, price: true, specialPrice: true, specialPriceStart: true, specialPriceEnd: true, comparePrice: true, image: true, stock: true, unit: true },
            },
            variant: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user!.userId },
        include: { items: { include: { product: { select: { id: true, name: true, slug: true, price: true, specialPrice: true, specialPriceStart: true, specialPriceEnd: true, comparePrice: true, image: true, stock: true, unit: true } }, variant: true } } },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.variant ? getActivePrice(item.variant) : item.product ? getActivePrice(item.product) : 0) * item.quantity, 0);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ success: true, data: { ...cart, subtotal: Math.round(subtotal * 100) / 100, itemCount } });
  });

  /** Add an item to the cart (or increment quantity) */
  addItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, variantId, quantity = 1 } = req.body;
    if (!productId && !variantId) throw new BadRequestError('Product ID or Variant ID is required');

    const ignoreStock = await getSettingBool('ignore_stock_limits');

    // Check product/variant exists and has stock
    let stockAvailable = 0;
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant) throw new NotFoundError('Variant not found');
      stockAvailable = variant.stock;
    } else if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundError('Product not found');
      stockAvailable = product.stock;
    }

    if (!ignoreStock && stockAvailable < quantity) throw new BadRequestError('Not enough stock available');

    // Get or create cart
    let cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user!.userId } });
    }

    // Upsert item: if already in cart, increment quantity
    const existingItem = await prisma.cartItem.findFirst({
      where: variantId 
        ? { cartId: cart.id, variantId }
        : { cartId: cart.id, productId },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (!ignoreStock && newQty > stockAvailable) throw new BadRequestError('Not enough stock available');
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: productId || null, variantId: variantId || null, quantity },
      });
    }

    res.status(201).json({ success: true, message: 'Item added to cart' });
  });

  /** Update item quantity in cart */
  updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) throw new BadRequestError('Quantity must be at least 1');

    const ignoreStock = await getSettingBool('ignore_stock_limits');

    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id as string },
      include: { cart: true, product: true, variant: true },
    }) as any;
    if (!item || item.cart.userId !== req.user!.userId) throw new NotFoundError('Cart item not found');
    
    const stockAvailable = item.variant ? item.variant.stock : item.product?.stock || 0;
    if (!ignoreStock && quantity > stockAvailable) throw new BadRequestError('Not enough stock');

    await prisma.cartItem.update({
      where: { id: req.params.id as string },
      data: { quantity },
    });

    res.json({ success: true, message: 'Cart item updated' });
  });

  /** Remove an item from cart */
  removeItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.id as string },
      include: { cart: true },
    }) as any;
    if (!item || item.cart.userId !== req.user!.userId) throw new NotFoundError('Cart item not found');

    await prisma.cartItem.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Cart item deleted successfully' });
  });

  /** Clear entire cart */
  clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.json({ success: true, message: 'Cart cleared' });
  });

  /** Sync local cart to backend (replaces backend items with local or merges them) */
  syncCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      throw new BadRequestError('Items array is required for syncing');
    }

    const userId = req.user!.userId;

    // Get or create cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Replace backend items with frontend items as source of truth
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      
      if (items.length > 0) {
        const validItems = items.filter((i: any) => i.productId || i.variantId).map((item: any) => ({
          cartId: cart!.id,
          productId: item.productId || null,
          variantId: item.variantId || null,
          quantity: item.quantity || 1
        }));
        
        if (validItems.length > 0) {
          const productIds = validItems
            .map((i: any) => i.productId)
            .filter((id): id is string => !!id);
          const variantIds = validItems
            .map((i: any) => i.variantId)
            .filter((id): id is string => !!id);

          const [existingProducts, existingVariants] = await Promise.all([
            productIds.length > 0
              ? tx.product.findMany({
                  where: { id: { in: productIds } },
                  select: { id: true },
                })
              : [],
            variantIds.length > 0
              ? tx.productVariant.findMany({
                  where: { id: { in: variantIds } },
                  select: { id: true },
                })
              : [],
          ]);

          const existingProductSet = new Set(existingProducts.map((p) => p.id));
          const existingVariantSet = new Set(existingVariants.map((v) => v.id));

          const filteredItems = validItems.filter((i: any) => {
            if (i.productId && !existingProductSet.has(i.productId)) {
              return false;
            }
            if (i.variantId && !existingVariantSet.has(i.variantId)) {
              return false;
            }
            return true;
          });

          if (filteredItems.length > 0) {
            await tx.cartItem.createMany({ data: filteredItems });
          }
        }
      }
    });

    res.status(200).json({ success: true, message: 'Cart synced successfully' });
  });

  /** Get abandoned carts (Admin only) */
  getAbandonedCarts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { isGuest } = req.query;
    const formattedCarts = await cartService.getAbandonedCarts(isGuest as string | undefined);
    res.json({ success: true, data: formattedCarts });
  });

  /** Aggressively capture abandoned carts before OTP verification (Public) */
  captureAbandonedCart = asyncHandler(async (req: Response | any, res: Response) => {
    const { name, phone, items } = req.body;
    if (!phone || !Array.isArray(items)) {
      throw new BadRequestError('Phone and items are required');
    }

    const result = await cartService.captureAbandonedCart(name, phone, items);
    res.status(200).json(result);
  });
}
