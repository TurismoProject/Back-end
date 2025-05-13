import { PrismaService } from '@database/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AbstractSupplierRepository } from './abstract-supplier.repository';
import { BookingStatus, Role, Supplier } from '@prisma/client';
import { CreateSupplierDto } from '@dtos/create-supplier.dto';
import { UpdateSupplierDto } from '@dtos/update-supplier.dto';
import { AbstractProductsRepository } from '@repositories/products/abstract-products.repository';
import {
  SupplierDashboardDto,
  MonthlyDataPoint,
} from '@dtos/supplier-dashboard.dto';
import { AuthService } from '@services/auth.service';
import { AuthModel } from '@common/models/auth.model';
import * as bcrypt from 'bcrypt';
import { AbstractAuthenticateRepository } from '@repositories/auth/abstract-authenticate.repository';

@Injectable()
export class SupplierRepository implements AbstractSupplierRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productRepository: AbstractProductsRepository,
    private readonly authService: AuthService,
    private readonly authRepository: AbstractAuthenticateRepository
  ) {}

  async create(data: CreateSupplierDto): Promise<Supplier> {
    const supplierExists = await this.getByEmail(data.email);

    if (supplierExists)
      throw new BadRequestException('Supplier already exists');

    return await this.prismaService.supplier.create({
      data,
    });
  }

  async login(email: string, password: string): Promise<AuthModel> {
    const supplier = await this.getByEmail(email);

    if (!supplier) throw new NotFoundException('Supplier not found');

    if (!(await bcrypt.compare(password, supplier.password)))
      throw new ConflictException('Invalid password');

    const tokens = this.authService.generateTokens(supplier);

    const authData: AuthModel = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      authId: supplier.id,
      expirationDateRefreshToken: tokens.expirationDateRefreshToken,
    };

    await this.authRepository.authenticateSupplier(authData);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getAll(): Promise<Array<Supplier>> {
    return await this.prismaService.supplier.findMany();
  }

  async getByUUID(uuid: string): Promise<Supplier> {
    return await this.prismaService.supplier.findUnique({
      where: { id: uuid },
    });
  }

  async getByEmail(email: string): Promise<Supplier> {
    return await this.prismaService.supplier.findUnique({
      where: { email },
    });
  }

  async getByJwt(jwt: string): Promise<Supplier> {
    const payload: { sub: string; email: string; role: Role } =
      this.authService.validateAccessToken(jwt);

    if (!payload) throw new UnauthorizedException('Invalid token');

    if (payload.role !== Role.SUPPLIER)
      throw new UnauthorizedException('Invalid token');

    const supplier = await this.prismaService.supplier.findUnique({
      where: { id: payload.sub },
    });

    if (!supplier) throw new NotFoundException('Supplier not found');

    if (supplier.email !== payload.email)
      throw new UnauthorizedException('Invalid token');

    return supplier;
  }

  async update(data: UpdateSupplierDto): Promise<Supplier> {
    try {
      const updatedSupplier = await this.prismaService.supplier.update({
        where: { id: data.id },
        data: {
          address: data.address,
          email: data.email,
          name: data.name,
          password: data.password,
          phoneNumber: data.phoneNumber,
        },
      });
      return updatedSupplier;
    } catch (e) {
      throw new NotFoundException('Product does not exists on database');
    }
  }

  async delete(uuid: string): Promise<null> {
    const result =
      await this.productRepository.deleteAllImagesBySupplierId(uuid);

    if (!result)
      throw new InternalServerErrorException(
        "Error deleting supplier's images"
      );

    await this.prismaService.supplier.delete({ where: { id: uuid } });
    return;
  }

  async getDashboardData(jwt: string): Promise<SupplierDashboardDto> {
    // Check if supplier exists
    const supplier = await this.getByJwt(jwt);
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Get all products for this supplier
    const products = await this.prismaService.product.findMany({
      where: { supplierId: supplier.id },
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
          supplierId: supplier.id,
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
    const currentMonthSales = bookings
      .filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, booking) => sum + Number(booking.totalPrice), 0);

    // Get previous month sales
    const previousMonthSales = bookings
      .filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate.getMonth() === previousMonth &&
          bookingDate.getFullYear() === previousMonthYear
        );
      })
      .reduce((sum, booking) => sum + Number(booking.totalPrice), 0);

    // Calculate percentage change
    const percentageChange =
      previousMonthSales === 0
        ? 100
        : ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;

    // Get monthly data for the last 6 months
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

      monthlySales.push({
        month: monthNames[monthIndex],
        sales: monthSales,
        orders: monthOrders,
      });
    }

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

  //Checks if the supplier id provided is the same as the one making the request
  async #validateSupplier(supplierId: string, jwt: string): Promise<boolean> {
    const payload: { sub: string; email: string; role: Role } =
      this.authService.validateAccessToken(jwt);

    return payload.sub === supplierId;
  }
}
