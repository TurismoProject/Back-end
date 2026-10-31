import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Identidade mínima carregada do banco pelo ReservationAccessGuard.
 *
 * O perfil vem da conta verificada, e não de campos enviados no corpo do pedido.
 * O nome é usado como fotografia do responsável ao criar uma reserva.
 */
export interface ReservationActor {
  id: string;
  role: Extract<Role, 'User' | 'Supplier'>;
  name: string;
}

/**
 * Injeta no controller a identidade verificada pelo ReservationAccessGuard.
 * @remarks Deve ser usado em rotas protegidas pelo guard antes da execução do handler.
 */
export const CurrentReservationActor = createParamDecorator(
  (_: unknown, context: ExecutionContext): ReservationActor =>
    context.switchToHttp().getRequest().reservationActor
);
