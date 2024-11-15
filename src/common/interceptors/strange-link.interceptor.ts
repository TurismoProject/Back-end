import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Inject,
  mixin,
  NestInterceptor,
  Type,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Request } from 'express';

abstract class RepositoryTemplate {
  abstract getUrls(id: string): Promise<Array<string>>;
}

abstract class RequestBodyTemplate {
  id: string;
  imagesUrl?: Array<string>;
}

export function StrangeLinkInterceptor<
  T extends RepositoryTemplate,
  K extends RequestBodyTemplate,
>(): Type<NestInterceptor> {
  class MixinStrangeLinkInterceptor implements NestInterceptor {
    constructor(@Inject('Repository') private repository: T) {}
    intercept(context: ExecutionContext, next: CallHandler) {
      if (context.getType() === 'http') {
        const request = context.switchToHttp().getRequest<Request>();
        const { id, imagesUrl } = request.body as K;

        if (!request['verifiedId']) {
          if (!isUUID(id)) {
            throw new BadRequestException('Invalid id');
          }
        }

        const dbUrls = request['repoUrls']
          ? request['repoUrls']
          : this.repository.getUrls(id);

        if (imagesUrl) {
          if (!imagesUrl.every((url) => dbUrls.includes(url)))
            throw new BadRequestException('Strange link not in database');
        }
        return next.handle();
      }

      return next.handle();
    }
  }
  return mixin(MixinStrangeLinkInterceptor);
}
