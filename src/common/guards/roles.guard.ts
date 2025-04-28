import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '@decorators/user-roles.decorator';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private jwtService: JwtService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token inválido');
        }

        const token = authHeader.split(' ')[1];

        let payload: any;
        try {
            payload = this.jwtService.verify(token);
        } catch (err) {
            throw new UnauthorizedException('Token inválido ou expirado');
        }

        const userRole: Role = payload.role;

        const hasRole = requiredRoles.includes(userRole);

        if (!hasRole) {
            throw new ForbiddenException('Usuário sem permissão para acessar este recurso');
        }

        request.user = payload;

        return true;
    }
}
