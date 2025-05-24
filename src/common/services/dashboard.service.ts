import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import {
  SupplierDashboardDto,
  MonthlyDataPoint,
} from '@dtos/supplier-dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSupplierDashboard(
    supplierId: string
  ): Promise<SupplierDashboardDto> {
    // Get all products for this supplier
    const products = await this.prismaService.product.findMany({
      where: { supplierId },
      include: {
        bookings: true,
      },
    });

    // Calculate total products
    const totalProducts = products.length;

    // Get all bookings for all products of this supplier
    const bookings = products.flatMap((product) => product.bookings);

    // Calculate total orders
    const totalOrders = bookings.length;

    // Calculate total sales
    const totalSales = bookings.reduce(
      (sum, booking) => sum + Number(booking.totalPrice),
      0
    );

    // Calculate orders by status
    const totalCompletedOrders = bookings.filter(
      (booking) => booking.status === BookingStatus.COMPLETED
    ).length;

    const totalPendingOrders = bookings.filter(
      (booking) => booking.status === BookingStatus.PENDING
    ).length;

    const totalCancelledOrders = bookings.filter(
      (booking) => booking.status === BookingStatus.CANCELLED
    ).length;

    // Get recent orders (last 10)
    const recentOrders = await this.prismaService.booking.findMany({
      where: {
        product: {
          supplierId,
        },
      },
      include: {
        product: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Format recent orders
    const formattedRecentOrders = recentOrders.map((booking) => ({
      id: booking.id,
      productName: booking.product.name,
      customerName: booking.user.name,
      date: booking.createdAt,
      status: booking.status,
      totalPrice: Number(booking.totalPrice),
    }));

    // Calculate sales comparison
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear =
      currentMonth === 0 ? currentYear - 1 : currentYear;

    // Get current month sales
    const currentMonthSales = this.calculateMonthlySales(
      bookings,
      currentMonth,
      currentYear
    );

    // Get previous month sales
    const previousMonthSales = this.calculateMonthlySales(
      bookings,
      previousMonth,
      previousMonthYear
    );

    // Calculate percentage change
    const percentageChange =
      previousMonthSales === 0
        ? 100
        : ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;

    // Get monthly data for the last 6 months
    const monthlySales = this.calculateLastSixMonthsData(bookings);

    return {
      totalProducts,
      totalOrders,
      totalSales,
      totalCompletedOrders,
      totalPendingOrders,
      totalCancelledOrders,
      recentOrders: formattedRecentOrders,
      salesComparison: {
        currentMonthSales,
        previousMonthSales,
        percentageChange,
        monthlySales,
      },
    };
  }

  private calculateMonthlySales(
    bookings: any[],
    month: number,
    year: number
  ): number {
    return bookings
      .filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate.getMonth() === month && bookingDate.getFullYear() === year
        );
      })
      .reduce((sum, booking) => sum + Number(booking.totalPrice), 0);
  }

  private calculateLastSixMonthsData(bookings: any[]): MonthlyDataPoint[] {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const monthlySales: MonthlyDataPoint[] = [];

    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;

      const monthlyBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate.getMonth() === monthIndex &&
          bookingDate.getFullYear() === year
        );
      });

      const monthSales = monthlyBookings.reduce(
        (sum, booking) => sum + Number(booking.totalPrice),
        0
      );

      const monthOrders = monthlyBookings.length;

      monthlySales.push({
        month: monthNames[monthIndex],
        sales: monthSales,
        orders: monthOrders,
      });
    }

    return monthlySales;
  }
}
