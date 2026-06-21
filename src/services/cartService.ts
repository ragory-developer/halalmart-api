import prisma from '../config/database';

export class CartService {
  /** Aggressively capture abandoned carts before OTP verification (Public) */
  async captureAbandonedCart(name: string, phone: string, items: any[]) {
    // Find or create user as guest
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name || 'Guest User',
          phone,
          isGuest: true,
          role: 'USER'
        }
      });
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: user.id } });
    }

    // Upsert items
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      
      const validItems = items.filter((i: any) => i.productId).map((item: any) => ({
        cartId: cart.id,
        productId: item.productId,
        quantity: item.quantity || 1
      }));
      
      if (validItems.length > 0) {
        const productIds = validItems
          .map((i: any) => i.productId)
          .filter((id): id is string => !!id);

        const existingProducts = productIds.length > 0
          ? await tx.product.findMany({
              where: { id: { in: productIds } },
              select: { id: true }
            })
          : [];

        const existingProductSet = new Set(existingProducts.map((p) => p.id));
        const filteredItems = validItems.filter((i: any) => i.productId && existingProductSet.has(i.productId));

        if (filteredItems.length > 0) {
          await tx.cartItem.createMany({ data: filteredItems });
        }
      }
    });

    return { success: true, message: 'Cart captured successfully' };
  }

  /** Get abandoned carts (Admin only) */
  async getAbandonedCarts(isGuest?: string) {
    const whereClause: any = {
      items: { some: {} }, // Cart must have at least one item
      user: { role: 'USER' } // Exclude Admin/Super Admin carts
    };

    if (isGuest !== undefined) {
      whereClause.user.isGuest = isGuest === 'true';
    }

    const carts = await prisma.cart.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, isGuest: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, image: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Process to calculate total value
    const formattedCarts = carts.map((cart: any) => {
      const totalValue = cart.items.reduce((sum: number, item: any) => sum + ((item.product?.price || 0) * item.quantity), 0);
      return {
        ...cart,
        totalValue
      };
    });

    return formattedCarts;
  }
}
