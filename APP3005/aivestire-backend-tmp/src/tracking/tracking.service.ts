import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationType } from '@prisma/client';

export interface AddTrackingUpdateDto {
  orderId: string;
  locationName: string;
  locationType: LocationType;
  statusDescription: string;
  latitude?: number;
  longitude?: number;
  deliveryPartnerAgent?: string;
  metadata?: any;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a delivery tracking update
   */
  async addTrackingUpdate(dto: AddTrackingUpdateDto) {
    this.logger.log(`Adding tracking update for order ${dto.orderId}`);

    const tracking = await this.prisma.deliveryTracking.create({
      data: {
        order_id: dto.orderId,
        location_name: dto.locationName,
        location_type: dto.locationType,
        status_description: dto.statusDescription,
        latitude: dto.latitude,
        longitude: dto.longitude,
        delivery_partner_agent: dto.deliveryPartnerAgent,
        metadata: dto.metadata,
      },
    });

    return tracking;
  }

  /**
   * Get all tracking updates for an order
   */
  async getOrderTracking(orderId: string) {
    const tracking = await this.prisma.deliveryTracking.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'asc' },
    });

    return tracking;
  }

  /**
   * Get latest tracking update for an order
   */
  async getLatestTracking(orderId: string) {
    const tracking = await this.prisma.deliveryTracking.findFirst({
      where: { order_id: orderId },
      orderBy: { created_at: 'desc' },
    });

    return tracking;
  }
}
