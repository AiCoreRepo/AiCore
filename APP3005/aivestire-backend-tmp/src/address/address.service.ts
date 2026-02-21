import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all addresses for a user
   */
  async getAddresses(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: { user_id: userId },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
    return addresses;
  }

  /**
   * Get default address for a user
   */
  async getDefaultAddress(userId: string): Promise<AddressResponseDto | null> {
    const address = await this.prisma.userAddress.findFirst({
      where: { user_id: userId, is_default: true },
    });

    // If no default, return the most recent address
    if (!address) {
      return await this.prisma.userAddress.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });
    }

    return address;
  }

  /**
   * Get a single address by ID
   */
  async getAddress(
    userId: string,
    addressId: string,
  ): Promise<AddressResponseDto> {
    const address = await this.prisma.userAddress.findUnique({
      where: { address_id: addressId },
    });

    if (!address || address.user_id !== userId) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  /**
   * Create a new address
   */
  async createAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    // If this is set as default, unset other defaults
    if (dto.is_default) {
      await this.unsetDefaultAddresses(userId);
    }

    // If this is the first address, make it default
    const existingCount = await this.prisma.userAddress.count({
      where: { user_id: userId },
    });

    const address = await this.prisma.userAddress.create({
      data: {
        user_id: userId,
        full_name: dto.full_name,
        phone: dto.phone,
        pincode: dto.pincode,
        address_line1: dto.address_line1,
        address_line2: dto.address_line2,
        city: dto.city,
        state: dto.state,
        landmark: dto.landmark,
        address_type: dto.address_type || 'HOME',
        is_default: dto.is_default || existingCount === 0,
      },
    });

    return address;
  }

  /**
   * Update an address
   */
  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    // Verify ownership
    const existing = await this.prisma.userAddress.findUnique({
      where: { address_id: addressId },
    });

    if (!existing || existing.user_id !== userId) {
      throw new NotFoundException('Address not found');
    }

    // If setting as default, unset other defaults
    if (dto.is_default) {
      await this.unsetDefaultAddresses(userId);
    }

    const address = await this.prisma.userAddress.update({
      where: { address_id: addressId },
      data: {
        ...(dto.full_name && { full_name: dto.full_name }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.pincode && { pincode: dto.pincode }),
        ...(dto.address_line1 && { address_line1: dto.address_line1 }),
        ...(dto.address_line2 !== undefined && {
          address_line2: dto.address_line2,
        }),
        ...(dto.city && { city: dto.city }),
        ...(dto.state && { state: dto.state }),
        ...(dto.landmark !== undefined && { landmark: dto.landmark }),
        ...(dto.address_type && { address_type: dto.address_type }),
        ...(dto.is_default !== undefined && { is_default: dto.is_default }),
      },
    });

    return address;
  }

  /**
   * Delete an address
   */
  async deleteAddress(
    userId: string,
    addressId: string,
  ): Promise<{ message: string }> {
    // Verify ownership
    const existing = await this.prisma.userAddress.findUnique({
      where: { address_id: addressId },
    });

    if (!existing || existing.user_id !== userId) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.userAddress.delete({
      where: { address_id: addressId },
    });

    // If deleted address was default, set another as default
    if (existing.is_default) {
      const nextAddress = await this.prisma.userAddress.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });

      if (nextAddress) {
        await this.prisma.userAddress.update({
          where: { address_id: nextAddress.address_id },
          data: { is_default: true },
        });
      }
    }

    return { message: 'Address deleted successfully' };
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(
    userId: string,
    addressId: string,
  ): Promise<AddressResponseDto> {
    // Verify ownership
    const existing = await this.prisma.userAddress.findUnique({
      where: { address_id: addressId },
    });

    if (!existing || existing.user_id !== userId) {
      throw new NotFoundException('Address not found');
    }

    // Unset other defaults
    await this.unsetDefaultAddresses(userId);

    // Set this as default
    const address = await this.prisma.userAddress.update({
      where: { address_id: addressId },
      data: { is_default: true },
    });

    return address;
  }

  /**
   * Helper to unset all default addresses for a user
   */
  private async unsetDefaultAddresses(userId: string): Promise<void> {
    await this.prisma.userAddress.updateMany({
      where: { user_id: userId, is_default: true },
      data: { is_default: false },
    });
  }
}
