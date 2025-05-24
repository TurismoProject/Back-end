import { Injectable } from '@nestjs/common';
import { AbstractBookingRepository } from './abstract-booking.repository';
import { PrismaService } from '@database/prisma/prisma.service';
import { Booking, BookingStatus, BulkBooking } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class BookingRepository implements AbstractBookingRepository {
  constructor(private readonly prismaService: PrismaService) {}

  //########################## B2C BOOKING SYSTEMS #########################
  async createUserBooking(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<Booking> {
    // Get product details
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Calculate total price
    const totalPrice = product.price.toNumber() * quantity;

    // Create booking
    const booking = await this.prismaService.booking.create({
      data: {
        startDate: new Date(), // This should be provided by the user in a real scenario
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day, should be provided by user
        guestCount: quantity,
        totalPrice: totalPrice,
        status: BookingStatus.PENDING,
        product: {
          connect: { id: productId },
        },
        user: {
          connect: { id: userId },
        },
      },
    });

    return booking;
  }

  async getAllUserBookings(userId: string): Promise<Booking[]> {
    const bookings = await this.prismaService.booking.findMany({
      where: {
        userId: userId,
      },
      include: {
        product: true,
      },
    });

    return bookings;
  }

  async getUserBookingById(userId: string, bookingId: string): Promise<Booking> {
    const booking = await this.prismaService.booking.findFirst({
      where: {
        id: bookingId,
        userId: userId,
      },
      include: {
        product: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateUserBookingStatus(
    userId: string,
    bookingId: string,
    status: BookingStatus
  ): Promise<Booking> {
    // Check if booking exists and belongs to the user
    const existingBooking = await this.prismaService.booking.findFirst({
      where: {
        id: bookingId,
        userId: userId,
      },
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    // Update booking status
    const updatedBooking = await this.prismaService.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: status,
      },
      include: {
        product: true,
      },
    });

    return updatedBooking;
  }

  //########################## B2B BOOKING SYSTEMS #########################
  async getAllBusinessBookings(businessId: string): Promise<BulkBooking[]> {
    const bulkBookings = await this.prismaService.bulkBooking.findMany({
      where: {
        businessClientId: businessId,
      },
      include: {
        bookings: {
          include: {
            product: true,
          },
        },
      },
    });

    return bulkBookings;
  }

  async getBusinessBookingById(
    businessId: string,
    bulkBookingId: string
  ): Promise<Booking> {
    // Find the bulk booking
    const bulkBooking = await this.prismaService.bulkBooking.findFirst({
      where: {
        id: bulkBookingId,
        businessClientId: businessId,
      },
      include: {
        bookings: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!bulkBooking || bulkBooking.bookings.length === 0) {
      throw new NotFoundException('Bulk booking not found');
    }

    // Return the first booking in the bulk booking
    // In a real scenario, you might want to handle this differently
    return bulkBooking.bookings[0];
  }

  async updateBusinessBookingStatus(
    businessId: string,
    bulkBookingId: string,
    status: BookingStatus
  ): Promise<Booking> {
    // Find the bulk booking
    const bulkBooking = await this.prismaService.bulkBooking.findFirst({
      where: {
        id: bulkBookingId,
        businessClientId: businessId,
      },
    });

    if (!bulkBooking) {
      throw new NotFoundException('Bulk booking not found');
    }

    // Update bulk booking status
    await this.prismaService.bulkBooking.update({
      where: {
        id: bulkBookingId,
      },
      data: {
        status: status,
      },
    });

    // Update all individual bookings in the bulk booking
    await this.prismaService.booking.updateMany({
      where: {
        bulkBookingId: bulkBookingId,
      },
      data: {
        status: status,
      },
    });

    // Return one of the updated bookings
    const updatedBooking = await this.prismaService.booking.findFirst({
      where: {
        bulkBookingId: bulkBookingId,
      },
      include: {
        product: true,
      },
    });

    return updatedBooking;
  }

  // Additional method to create a bulk booking for business clients
  async createBusinessBulkBooking(
    businessId: string,
    productIds: string[],
    quantities: number[],
    userId: string, // User ID for the bookings
    specialRate?: number,
    paymentTerms?: number
  ): Promise<BulkBooking> {
    // Calculate total amount
    let totalAmount = 0;
    const bookingData = [];

    // Prepare booking data
    for (let i = 0; i < productIds.length; i++) {
      const product = await this.prismaService.product.findUnique({
        where: { id: productIds[i] },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productIds[i]} not found`);
      }

      const price = specialRate || product.price.toNumber() * quantities[i];
      totalAmount += price;

      bookingData.push({
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        guestCount: quantities[i],
        totalPrice: price,
        status: BookingStatus.PENDING,
        productId: productIds[i],
        userId: userId,
      });
    }

    // Create bulk booking with associated bookings
    const bulkBooking = await this.prismaService.bulkBooking.create({
      data: {
        businessClientId: businessId,
        totalAmount: totalAmount,
        status: BookingStatus.PENDING,
        specialRate: specialRate,
        paymentTerms: paymentTerms || 30,
        bookings: {
          create: bookingData,
        },
      },
      include: {
        bookings: true,
      },
    });

    return bulkBooking;
  }
}
