import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface ReservationActor {
  id: string;
  role: Extract<Role, 'User' | 'Supplier'>;
  name: string;
}

export const CurrentReservationActor = createParamDecorator(
  (_: unknown, context: ExecutionContext): ReservationActor =>
    context.switchToHttp().getRequest().reservationActor
);
