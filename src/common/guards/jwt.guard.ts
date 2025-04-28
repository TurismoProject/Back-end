import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            return (await super.canActivate(context)) as boolean;
        } catch (error) {
            this.handleAuthorizationError(error);
        }
    }

    handleRequest(err: any, user: any): any {
        if (err || !user) {
            throw new UnauthorizedException();
        }
        return user;
    }

    private handleAuthorizationError(error: any): never {
        throw new UnauthorizedException(
            error.message
        );
    }
}
