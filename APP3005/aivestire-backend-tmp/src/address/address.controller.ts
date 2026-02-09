import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressController {
    constructor(private readonly addressService: AddressService) { }

    @Get()
    @ApiOperation({ summary: 'Get all addresses for current user' })
    @ApiResponse({
        status: 200,
        description: 'Addresses retrieved successfully',
        type: [AddressResponseDto],
    })
    async getAddresses(@Request() req): Promise<AddressResponseDto[]> {
        return this.addressService.getAddresses(req.user.user_id);
    }

    @Get('default')
    @ApiOperation({ summary: 'Get default delivery address' })
    @ApiResponse({
        status: 200,
        description: 'Default address retrieved',
        type: AddressResponseDto,
    })
    async getDefaultAddress(@Request() req): Promise<AddressResponseDto | null> {
        return this.addressService.getDefaultAddress(req.user.user_id);
    }

    @Get(':addressId')
    @ApiOperation({ summary: 'Get a single address by ID' })
    @ApiResponse({
        status: 200,
        description: 'Address retrieved successfully',
        type: AddressResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Address not found' })
    async getAddress(
        @Request() req,
        @Param('addressId') addressId: string,
    ): Promise<AddressResponseDto> {
        return this.addressService.getAddress(req.user.user_id, addressId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new address' })
    @ApiResponse({
        status: 201,
        description: 'Address created successfully',
        type: AddressResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid address data' })
    async createAddress(
        @Request() req,
        @Body() dto: CreateAddressDto,
    ): Promise<AddressResponseDto> {
        return this.addressService.createAddress(req.user.user_id, dto);
    }

    @Patch(':addressId')
    @ApiOperation({ summary: 'Update an address' })
    @ApiResponse({
        status: 200,
        description: 'Address updated successfully',
        type: AddressResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Address not found' })
    async updateAddress(
        @Request() req,
        @Param('addressId') addressId: string,
        @Body() dto: UpdateAddressDto,
    ): Promise<AddressResponseDto> {
        return this.addressService.updateAddress(req.user.user_id, addressId, dto);
    }

    @Delete(':addressId')
    @ApiOperation({ summary: 'Delete an address' })
    @ApiResponse({
        status: 200,
        description: 'Address deleted successfully',
    })
    @ApiResponse({ status: 404, description: 'Address not found' })
    async deleteAddress(
        @Request() req,
        @Param('addressId') addressId: string,
    ): Promise<{ message: string }> {
        return this.addressService.deleteAddress(req.user.user_id, addressId);
    }

    @Post(':addressId/set-default')
    @ApiOperation({ summary: 'Set an address as default' })
    @ApiResponse({
        status: 200,
        description: 'Address set as default',
        type: AddressResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Address not found' })
    async setDefaultAddress(
        @Request() req,
        @Param('addressId') addressId: string,
    ): Promise<AddressResponseDto> {
        return this.addressService.setDefaultAddress(req.user.user_id, addressId);
    }
}
