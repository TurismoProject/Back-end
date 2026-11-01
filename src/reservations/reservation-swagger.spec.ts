import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ReservationAccessGuard } from './auth/reservation-access.guard';
import { DepartureService } from './departure.service';
import {
  DepartureCatalogController,
  SupplierReservationsController,
  UserReservationsController,
} from './reservation.controller';
import { ReservationService } from './reservation.service';
import { SupplierDashboardService } from './supplier-dashboard.service';
import { ProductsController } from '../base/controllers/products.controller';
import { BucketService } from '../base/database/bucket/bucket.service';
import { AbstractProductsRepository } from '../base/repositories/products/abstract-products.repository';

describe('Reservations Swagger contracts', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        SupplierReservationsController,
        UserReservationsController,
        DepartureCatalogController,
        ProductsController,
      ],
      providers: [
        { provide: DepartureService, useValue: {} },
        { provide: ReservationService, useValue: {} },
        { provide: SupplierDashboardService, useValue: {} },
        { provide: BucketService, useValue: {} },
        { provide: AbstractProductsRepository, useValue: {} },
      ],
    })
      .overrideGuard(ReservationAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    await app.init();
    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build()
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each([
    '/provedor/saidas',
    '/provedor/saidas/{departureId}/reservas',
    '/provedor/saidas/{departureId}/reservas/{reservationId}/historico',
    '/usuario/reservas',
    '/passeios/saidas',
  ])('describes numeric pagination as scalar parameters in %s', (path) => {
    const parameters = document.paths[path].get.parameters;
    for (const [name, defaultValue, maximum] of [
      ['page', 1, 100000],
      ['limit', 20, 100],
    ] as const) {
      const parameter = parameters.find(
        (item) => 'name' in item && item.name === name
      );
      expect(parameter).toMatchObject({
        name,
        in: 'query',
        required: false,
        schema: { type: 'integer', default: defaultValue, minimum: 1, maximum },
      });
      if (parameter && 'schema' in parameter) {
        expect(parameter.schema).not.toHaveProperty('$ref');
        expect(parameter.schema).not.toHaveProperty('allOf');
      }
    }
  });

  it('describes the departure time zone as a string instead of an object', () => {
    const schema = document.components.schemas.CreateDepartureDto;
    expect(schema).toHaveProperty('properties.timeZone', {
      type: 'string',
      default: 'America/Maceio',
    });
  });

  it('provides an authenticated multipart form for product creation with image uploads', () => {
    const operation = document.paths['/produto/criar'].post;
    expect(operation.security).toEqual([{ bearer: [] }]);
    expect(operation.requestBody).toMatchObject({
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['name', 'description', 'price', 'supplierId', 'images'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'string', example: '120.00' },
              supplierId: { type: 'string', format: 'uuid' },
              images: {
                type: 'array',
                minItems: 1,
                maxItems: 5,
                items: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
    });
    if (operation.requestBody && 'content' in operation.requestBody) {
      expect(operation.requestBody.content).not.toHaveProperty(
        'application/json'
      );
    }
  });
});
