import { BookingStatus } from '@prisma/client';

export class SupplierDashboardDto {
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  totalCompletedOrders: number;
  totalPendingOrders: number;
  totalCancelledOrders: number;
  recentOrders: RecentOrderDto[];
  salesComparison: SalesComparisonDto;
}

export class RecentOrderDto {
  id: string;
  productName: string;
  customerName: string;
  date: Date;
  status: BookingStatus;
  totalPrice: number;
}

export class SalesComparisonDto {
  currentMonthSales: number;
  previousMonthSales: number;
  percentageChange: number;
  monthlySales: MonthlyDataPoint[];
}

export class MonthlyDataPoint {
  month: string;
  sales: number;
  orders: number;
}