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
import { tap } from 'rxjs';

abstract class RepositoryTemplate {
  abstract getUrls(id: string): Promise<Array<string>>;
}

class RequestBodyTemplate {
  id: string;
}

export function FileCountInterceptor<
  T extends RepositoryTemplate,
  K extends RequestBodyTemplate,
>(options: { maxCount: number }): Type<NestInterceptor> {
  @Injectable()
  class MixinFileCountInterceptor implements NestInterceptor {
    constructor(@Inject('Repository') private repository: T) {}
    async intercept(context: ExecutionContext, next: CallHandler) {
      if (context.getType() === 'http') {
        const request = context.switchToHttp().getRequest<Request>();
        if (!request.files) return next.handle();

        const { id } = request.body as K;

        if (!isUUID(id)) throw new BadRequestException('Invalid id');

        const dbUrls = await this.repository.getUrls(id);
        const filesCount = Array.isArray(request.files)
          ? request.files.length
          : 0;
        if (dbUrls.length + filesCount > options.maxCount) {
          throw new BadRequestException('Max file count exceeded');
        }

        request['repoUrls'] = dbUrls;
        request['verifiedId'] = true;

        return next.handle().pipe(
          tap(() => {
            delete request['repoUrls'];
            delete request['verifiedId'];
          }),
        );
      }

      return next.handle();
    }
  }
  return mixin(MixinFileCountInterceptor);
}
