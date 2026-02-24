import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserDashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getStats(userId: string) {
        const [totalOrders, wishlistItems, savedAddresses, cartItems] = await Promise.all([
            this.prisma.order.count({
                where: { user_id: userId },
            }),
            this.prisma.wishlistItem.count({
                where: { wishlist: { user_id: userId } },
            }),
            this.prisma.userAddress.count({
                where: { user_id: userId },
            }),
            this.prisma.cartItem.count({
                where: { cart: { user_id: userId } },
            }),
        ]);

        // Fetch recent activities
        const [recentOrders, recentWishlist] = await Promise.all([
            this.prisma.order.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
                take: 3,
                select: {
                    order_id: true,
                    order_number: true,
                    current_status: true,
                    total_amount: true,
                    created_at: true,
                },
            }),
            this.prisma.wishlistItem.findMany({
                where: { wishlist: { user_id: userId } },
                orderBy: { added_at: 'desc' },
                take: 3,
                include: {
                    product: {
                        select: {
                            title: true,
                            price_cents: true,
                        },
                    },
                },
            }),
        ]);

        const activities = [
            ...recentOrders.map((order) => ({
                id: order.order_id,
                type: 'ORDER',
                title: `Order #${order.order_number} placed`,
                status: order.current_status,
                date: order.created_at,
                amount: order.total_amount,
            })),
            ...recentWishlist.map((item) => ({
                id: item.wishlist_item_id,
                type: 'WISHLIST',
                title: `Added ${item.product.title} to wishlist`,
                date: item.added_at,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

        return {
            stats: {
                totalOrders,
                wishlistItems,
                savedAddresses,
                cartItems,
            },
            recentActivity: activities,
        };
    }
}
