import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  mixin,
  NestInterceptor,
  Type,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Request } from 'express';

abstract class RepositoryTemplate {
  abstract getHowManyFiles(id: string): Promise<Array<string>>;
}

class RequestBodyTemplate {
  id: string;
}

export function FileCountInterceptor<
  T extends RepositoryTemplate,
  K extends RequestBodyTemplate,
>({
  maxCount,
  minCount = 0,
}: {
  maxCount: number;
  minCount?: number;
}): Type<NestInterceptor> {
  @Injectable()
  class MixinFileCountInterceptor implements NestInterceptor {
    constructor(@Inject('Repository') private repository: T) {}
    async intercept(context: ExecutionContext, next: CallHandler) {
      if (context.getType() === 'http') {
        const request = context.switchToHttp().getRequest<Request>();
        if (!request.files) return next.handle();

        const { id } = request.body as K;

        if (!isUUID(id)) throw new BadRequestException('Invalid id');

        const filesArray = await this.repository.getHowManyFiles(id);
        const filesCount = Array.isArray(request.files)
          ? request.files.length
          : 0;
        if (filesArray.length + filesCount > maxCount) {
          throw new BadRequestException('Max file count exceeded');
        }

        if (filesArray.length + filesCount < minCount) {
          throw new BadRequestException('Min file count exceeded');
        }

        return next.handle();
      }

      return next.handle();
    }
  }
  return mixin(MixinFileCountInterceptor);
}
