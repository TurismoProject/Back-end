import { Booking, BookingStatus, BulkBooking } from '@prisma/client';

export abstract class AbstractBookingRepository {
  // BASIC USER BOOKING FUNCTIONALITY
  abstract createUserBooking(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<Booking>;

  abstract getAllUserBookings(userId: string): Promise<Booking[]>;
  abstract getUserBookingById(userId: string, bookingId: string): Promise<Booking>;

  abstract updateUserBookingStatus(
    userId: string,
    bookingId: string,
    status: BookingStatus
  ): Promise<Booking>;

  // BUSINESS CLIENT BOOKING FUNCTIONALITY
  abstract getAllBusinessBookings(businessId: string): Promise<BulkBooking[]>;

  abstract getBusinessBookingById(
    businessId: string,
    bulkBookingId: string
  ): Promise<Booking>;

  abstract updateBusinessBookingStatus(
    businessId: string,
    bulkBookingId: string,
    status: BookingStatus
  ): Promise<Booking>;
  
  // Create bulk booking for business clients
  abstract createBusinessBulkBooking(
    businessId: string,
    productIds: string[],
    quantities: number[],
    userId: string,
    specialRate?: number,
    paymentTerms?: number
  ): Promise<BulkBooking>;
}
