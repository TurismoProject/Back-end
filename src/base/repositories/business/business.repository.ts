import { Injectable } from '@nestjs/common';
import { AbstractBusinessRepository } from './abstract-business.repository';
import { BaseAuthRepository } from '@commonrepos/base.repository';
import { PrismaService } from '@database/prisma/prisma.service';
import { BusinessClient } from '@prisma/client';
import { CreateBusinessClientDto } from '@dtos/create-business-client.dto';
import { UpdateBusinessClientDto } from '@dtos/update-business-client.dto';
import { JwtGeneratorService } from '@services/jwt-gen.service';
import { AbstractAuthenticateRepository } from '@repositories/auth/abstract-authenticate.repository';

@Injectable()
export class BusinessRepository
  extends BaseAuthRepository<
    BusinessClient,
    CreateBusinessClientDto,
    UpdateBusinessClientDto
  >
  implements AbstractBusinessRepository
{
  constructor(
    protected readonly prismaService: PrismaService,
    protected readonly jwtGenService: JwtGeneratorService,
    protected readonly authRepository: AbstractAuthenticateRepository
  ) {
    super(prismaService, authRepository, jwtGenService);
  }

  protected get model() {
    return this.prismaService.businessClient;
  }
}
