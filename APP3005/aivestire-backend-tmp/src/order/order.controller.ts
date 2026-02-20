import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { OrderService } from './services/order.service';
import { TrackingService } from '../tracking/tracking.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CollectCODDto } from './dto/collect-cod.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly trackingService: TrackingService,
    ) { }

    /**
     * Create a new order
     */
    @Post()
    async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
        console.log("OrderController: Received create order request");
        return this.orderService.createOrder(req.user.user_id, createOrderDto);
    }

    /**
     * Get all orders (Admin only)
     */
    @Get('all')
    async getAllOrders(@Request() req) {
        // Check if user is admin
        if (req.user.role !== UserRole.ADMIN) {
            throw new Error('Unauthorized - Admin access required');
        }
        return this.orderService.getAllOrders();
    }

    /**
     * Get user's orders
     */
    @Get('my-orders')
    async getMyOrders(@Request() req) {
        return this.orderService.getUserOrders(req.user.user_id);
    }

    /**
     * Get specific order details
     */
    @Get(':id')
    async getOrder(@Request() req, @Param('id') orderId: string) {
        return this.orderService.getOrderTracking(orderId, req.user.user_id);
    }

    /**
     * Update order status (Admin/Delivery Partner only)
     */
    @Post(':id/status')
    async updateStatus(
        @Request() req,
        @Param('id') orderId: string,
        @Body() updateStatusDto: UpdateOrderStatusDto,
    ) {
        // Check if user is admin or delivery partner
        if (![UserRole.ADMIN, 'DELIVERY_PARTNER' as any].includes(req.user.role)) {
            throw new Error('Unauthorized');
        }

        return this.orderService.updateOrderStatus(
            orderId,
            updateStatusDto,
            req.user.user_id,
            req.user.role,
        );
    }

    /**
     * Mark COD as collected
     */
    @Post(':id/cod-collect')
    async collectCOD(
        @Param('id') orderId: string,
        @Body() collectCODDto: CollectCODDto,
    ) {
        return this.orderService.collectCOD(orderId, collectCODDto);
    }

    /**
     * Cancel order
     */
    @Post(':id/cancel')
    async cancelOrder(
        @Request() req,
        @Param('id') orderId: string,
        @Body() cancelOrderDto: CancelOrderDto,
    ) {
        return this.orderService.cancelOrder(
            orderId,
            cancelOrderDto,
            req.user.user_id,
        );
    }

    /**
     * Get order tracking
     */
    @Get(':id/tracking')
    async getTracking(@Request() req, @Param('id') orderId: string) {
        return this.orderService.getOrderTracking(orderId, req.user.user_id);
    }
}
