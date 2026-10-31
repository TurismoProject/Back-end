import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MailerService } from '@nestjs-modules/mailer';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { generateKeyPairSync, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { PrismaService } from '../src/base/database/prisma/prisma.service';
import { BucketService } from '../src/base/database/bucket/bucket.service';
import { UserModule } from '../src/base/modules/user.module';
import { AdminModule } from '../src/base/modules/admin.module';
import { EmailService } from '../src/common/services/email.service';
import { SupplierModule } from '../src/base/modules/supplier.module';
import { ReservationsModule } from '../src/reservations/reservations.module';
import { AuthService } from '../src/common/services/auth.service';

/** Run only against a dedicated test database; never loads the application .env. */
describe('Reservations API (PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let auth: AuthService;
  let supplierId: string;
  let userId: string;
  let productId: string;
  let otherProductId: string;
  let departureId: string;
  let supplierToken: string;
  let otherSupplierToken: string;
  let userToken: string;
  let otherUserToken: string;
  let passwordHash: string;

  beforeAll(async () => {
    const testUrl = process.env.TEST_DATABASE_URL;
    if (!testUrl || !new URL(testUrl).pathname.endsWith('_test')) {
      throw new Error(
        'Defina TEST_DATABASE_URL para um banco PostgreSQL exclusivo terminado em _test. Consulte docs/reservations.md.'
      );
    }
    process.env.DATABASE_URL = testUrl;
    const keys = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    prisma = new PrismaService();
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              AWS_REGION: 'us-east-1',
              AWS_ACCESS_KEY_ID: 'test',
              AWS_SECRET_ACCESS_KEY: 'test',
              JWT_PRIVATE_KEY: Buffer.from(keys.privateKey).toString('base64'),
              JWT_PUBLIC_KEY: Buffer.from(keys.publicKey).toString('base64'),
              google: {
                clientId: 'test-client',
                clientSecret: 'test-secret',
                callbackUrl: 'http://localhost/unused',
              },
            }),
          ],
        }),
        ReservationsModule,
        SupplierModule,
        UserModule,
        AdminModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(MailerService)
      .useValue({ sendMail: jest.fn().mockResolvedValue({}) })
      .overrideProvider(EmailService)
      .useValue({ sendEmail: jest.fn().mockResolvedValue({}) })
      .overrideProvider(BucketService)
      .useValue({ getBucket: jest.fn() })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();
    auth = app.get(AuthService);
    passwordHash = await bcrypt.hash('Teste@1234', 4);
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.reservationEvent.deleteMany(),
      prisma.reservationParticipant.deleteMany(),
      prisma.reservation.deleteMany(),
      prisma.tourDeparture.deleteMany(),
      prisma.product.deleteMany(),
      prisma.supplierJWTs.deleteMany(),
      prisma.userJWTs.deleteMany(),
      prisma.supplier.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    const supplier = await prisma.supplier.create({
      data: {
        name: 'Barcos Alagoas',
        email: 'supplier@test.example',
        password: passwordHash,
        cnpj: '11111111000111',
        phoneNumber: '82999999999',
        address: 'Maceió',
      },
    });
    const otherSupplier = await prisma.supplier.create({
      data: {
        name: 'Outro fornecedor',
        email: 'other@test.example',
        password: passwordHash,
        cnpj: '22222222000122',
        phoneNumber: '82988888888',
        address: 'Maceió',
      },
    });
    const user = await prisma.user.create({
      data: {
        name: 'Ana Responsável',
        email: 'ana@test.example',
        password: passwordHash,
      },
    });
    const otherUser = await prisma.user.create({
      data: {
        name: 'Outro turista',
        email: 'other-user@test.example',
        password: passwordHash,
      },
    });
    const product = await prisma.product.create({
      data: {
        name: 'Passeio de barco',
        description: 'Passeio',
        price: '12.50',
        imagesUrl: [],
        supplierId: supplier.id,
      },
    });
    const otherProduct = await prisma.product.create({
      data: {
        name: 'Outro passeio',
        description: 'Passeio',
        price: '20.00',
        imagesUrl: [],
        supplierId: otherSupplier.id,
      },
    });
    const departure = await prisma.tourDeparture.create({
      data: {
        productId: product.id,
        startsAt: new Date(Date.now() + 3600000),
        capacity: 4,
        pricePerPerson: '12.50',
      },
    });
    supplierId = supplier.id;
    userId = user.id;
    productId = product.id;
    otherProductId = otherProduct.id;
    departureId = departure.id;
    supplierToken = auth.generateTokens(supplier).accessToken;
    otherSupplierToken = auth.generateTokens(otherSupplier).accessToken;
    userToken = auth.generateTokens(user).accessToken;
    otherUserToken = auth.generateTokens(otherUser).accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    else if (prisma) await prisma.$disconnect();
  });

  const supplierPath = () => `/provedor/saidas/${departureId}`;
  const reserve = async (
    count = 2,
    token?: string,
    requestKey = randomUUID()
  ) => {
    const response = await request(app.getHttpServer())
      .post('/usuario/reservas')
      .auth(token ?? userToken, { type: 'bearer' })
      .send({
        departureId,
        requestKey,
        participants: Array.from({ length: count }, (_, i) => ({
          name: `Turista ${i + 1}`,
        })),
      })
      .expect(201);
    return response.body;
  };
  const resolve = (
    ids: string[],
    action = 'CONFIRM',
    reason?: string,
    token?: string
  ) =>
    request(app.getHttpServer())
      .patch(`${supplierPath()}/reservas/resolver`)
      .auth(token ?? supplierToken, { type: 'bearer' })
      .send({ reservationIds: ids, action, ...(reason ? { reason } : {}) });
  const attendance = (ids: string[], value: string, token?: string) =>
    request(app.getHttpServer())
      .patch(`${supplierPath()}/participantes/comparecimento`)
      .auth(token ?? supplierToken, { type: 'bearer' })
      .send({ participantIds: ids, attendance: value });

  it('publishes the new request schemas and routes through Swagger', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build()
    );
    expect(
      document.paths['/provedor/saidas/{departureId}/reservas/resolver'].patch
    ).toBeDefined();
    expect(document.paths['/usuario/reservas'].post).toBeDefined();
    expect(document.components.schemas.CreateReservationDto).toBeDefined();
  });

  it('requires a real account with the correct role and an access token', async () => {
    await request(app.getHttpServer()).get('/provedor/saidas').expect(401);
    await request(app.getHttpServer())
      .get('/provedor/saidas')
      .auth(userToken, { type: 'bearer' })
      .expect(403);
    const refresh = auth.generateTokens({
      id: supplierId,
      email: 'supplier@test.example',
      role: Role.Supplier,
    }).refreshToken;
    await request(app.getHttpServer())
      .get('/provedor/saidas')
      .auth(refresh, { type: 'bearer' })
      .expect(401);
    const forgedRole = auth.generateTokens({
      id: userId,
      email: 'ana@test.example',
      role: Role.Supplier,
    }).accessToken;
    await request(app.getHttpServer())
      .get('/provedor/saidas')
      .auth(forgedRole, { type: 'bearer' })
      .expect(401);
    const expired = app
      .get(JwtService)
      .sign(
        { sub: supplierId, role: Role.Supplier, tokenUse: 'access' },
        { expiresIn: -1 }
      );
    await request(app.getHttpServer())
      .get('/provedor/saidas')
      .auth(expired, { type: 'bearer' })
      .expect(401);
  });

  it('issues supplier credentials without leaking hashes and rotates refresh tokens', async () => {
    const login = await request(app.getHttpServer())
      .post('/provedor/login')
      .send({ email: 'supplier@test.example', password: 'Teste@1234' })
      .expect(200);
    expect(login.body.password).toBeUndefined();
    expect(login.body.supplier.password).toBeUndefined();
    expect(login.body.supplier.id).toBe(supplierId);
    await request(app.getHttpServer())
      .get('/provedor/saidas')
      .auth(login.body.accessToken, { type: 'bearer' })
      .expect(200);
    const refreshed = await request(app.getHttpServer())
      .post('/provedor/relogar')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);
    await request(app.getHttpServer())
      .post('/provedor/relogar')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .post('/provedor/login')
      .send({ email: 'supplier@test.example', password: 'errada' })
      .expect(401);
  });

  it('protects legacy supplier profile operations and hashes password changes', async () => {
    await request(app.getHttpServer())
      .patch('/provedor/atualizar')
      .send({ id: supplierId, name: 'Invasor' })
      .expect(401);
    await request(app.getHttpServer())
      .patch('/provedor/atualizar')
      .auth(otherSupplierToken, { type: 'bearer' })
      .send({ id: supplierId, name: 'Invasor' })
      .expect(404);
    await request(app.getHttpServer())
      .patch('/provedor/atualizar')
      .auth(supplierToken, { type: 'bearer' })
      .send({ password: 'Nova@1234' })
      .expect(200);
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    expect(await bcrypt.compare('Nova@1234', supplier.password)).toBe(true);
    const profile = await request(app.getHttpServer())
      .get('/provedor')
      .auth(supplierToken, { type: 'bearer' })
      .expect(200);
    expect(profile.body.password).toBeUndefined();
  });

  it('creates owned departures and rejects duplicate slots, foreign products and invalid time zones', async () => {
    const dto = {
      productId,
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      capacity: 20,
      pricePerPerson: '100.00',
      timeZone: 'America/Maceio',
    };
    const created = await request(app.getHttpServer())
      .post('/provedor/saidas')
      .auth(supplierToken, { type: 'bearer' })
      .send(dto)
      .expect(201);
    expect(created.body.pricePerPerson).toBe('100');
    await request(app.getHttpServer())
      .post('/provedor/saidas')
      .auth(supplierToken, { type: 'bearer' })
      .send(dto)
      .expect(409);
    await request(app.getHttpServer())
      .post('/provedor/saidas')
      .auth(supplierToken, { type: 'bearer' })
      .send({ ...dto, productId: otherProductId })
      .expect(404);
    await request(app.getHttpServer())
      .post('/provedor/saidas')
      .auth(supplierToken, { type: 'bearer' })
      .send({ ...dto, timeZone: 'invalid-zone' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/provedor/saidas')
      .auth(supplierToken, { type: 'bearer' })
      .send({ ...dto, pricePerPerson: '0.00' })
      .expect(400);
  });

  it('keeps the responsible person separate from passengers and preserves monetary snapshots', async () => {
    const booking = await reserve(3);
    expect(booking.responsibleName).toBe('Ana Responsável');
    expect(booking.participants.map((p) => p.name).sort()).toEqual([
      'Turista 1',
      'Turista 2',
      'Turista 3',
    ]);
    expect(booking.totalPrice).toBe('37.5');
    expect(booking.status).toBe('PENDING');
    expect(booking.password).toBeUndefined();
    await prisma.product.update({
      where: { id: productId },
      data: { price: '99.99' },
    });
    const stored = await prisma.reservation.findUnique({
      where: { id: booking.id },
    });
    expect(stored.pricePerPerson.toString()).toBe('12.5');
    expect(stored.totalPrice.toString()).toBe('37.5');
  });

  it('deduplicates concurrent creation and rejects reuse of a key with a different payload', async () => {
    const key = randomUUID();
    const bookings = await Promise.all([
      reserve(2, userToken, key),
      reserve(2, userToken, key),
    ]);
    expect(bookings[0].id).toBe(bookings[1].id);
    expect(await prisma.reservation.count()).toBe(1);
    expect(
      await prisma.reservationEvent.count({ where: { action: 'CREATED' } })
    ).toBe(1);
    await request(app.getHttpServer())
      .post('/usuario/reservas')
      .auth(userToken, { type: 'bearer' })
      .send({
        departureId,
        requestKey: key,
        participants: [{ name: 'Outra pessoa' }],
      })
      .expect(409);
  });

  it('validates nested participants and rejects injected booking state', async () => {
    const dto = {
      departureId,
      requestKey: randomUUID(),
      participants: [{ name: 'Ana Souza' }],
    };
    await request(app.getHttpServer())
      .post('/usuario/reservas')
      .auth(userToken, { type: 'bearer' })
      .send({ ...dto, status: 'CONFIRMED' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/usuario/reservas')
      .auth(userToken, { type: 'bearer' })
      .send({
        ...dto,
        participants: [{ name: 'Ana Souza', attendance: 'BOARDED' }],
      })
      .expect(400);
    expect(await prisma.reservation.count()).toBe(0);
  });

  it('isolates tourists and suppliers when reading reservations and their histories', async () => {
    const booking = await reserve();
    await request(app.getHttpServer())
      .get(`/usuario/reservas/${booking.id}`)
      .auth(otherUserToken, { type: 'bearer' })
      .expect(404);
    const own = await request(app.getHttpServer())
      .get('/usuario/reservas')
      .auth(userToken, { type: 'bearer' })
      .expect(200);
    expect(own.body.total).toBe(1);
    const others = await request(app.getHttpServer())
      .get('/usuario/reservas')
      .auth(otherUserToken, { type: 'bearer' })
      .expect(200);
    expect(others.body.total).toBe(0);
    await request(app.getHttpServer())
      .get(`${supplierPath()}/reservas`)
      .auth(otherSupplierToken, { type: 'bearer' })
      .expect(404);
    await request(app.getHttpServer())
      .get(`${supplierPath()}/reservas/${booking.id}/historico`)
      .auth(otherSupplierToken, { type: 'bearer' })
      .expect(404);
    await resolve(
      [booking.id],
      'CONFIRM',
      undefined,
      otherSupplierToken
    ).expect(404);
    await attendance(
      [booking.participants[0].id],
      'BOARDED',
      otherSupplierToken
    ).expect(404);
  });

  it('confirms up to exact capacity and makes retries harmless', async () => {
    const first = await reserve(2);
    const second = await reserve(2, otherUserToken);
    const result = await resolve([first.id, second.id]).expect(200);
    expect(result.body.changed).toBe(2);
    const retry = await resolve([first.id, second.id]).expect(200);
    expect(retry.body.changed).toBe(0);
    expect(
      await prisma.reservationEvent.count({ where: { action: 'CONFIRMED' } })
    ).toBe(2);
    await request(app.getHttpServer())
      .post('/usuario/reservas')
      .auth(userToken, { type: 'bearer' })
      .send({
        departureId,
        requestKey: randomUUID(),
        participants: [{ name: 'Sem vaga' }],
      })
      .expect(409);
    const list = await request(app.getHttpServer())
      .get('/provedor/saidas')
      .auth(supplierToken, { type: 'bearer' })
      .expect(200);
    expect(list.body.items[0].availableSeats).toBe(0);
    expect(list.body.items[0].metrics.confirmedParticipants).toBe(4);
  });

  it('rolls back the entire selection when it exceeds capacity or contains a foreign ID', async () => {
    const first = await reserve(3);
    const second = await reserve(2, otherUserToken);
    await resolve([first.id, second.id]).expect(409);
    expect(
      await prisma.reservation.count({ where: { status: 'CONFIRMED' } })
    ).toBe(0);
    expect(
      await prisma.reservationEvent.count({ where: { action: 'CONFIRMED' } })
    ).toBe(0);
    await resolve([first.id, randomUUID()]).expect(404);
    expect(
      await prisma.reservation.count({ where: { status: 'CONFIRMED' } })
    ).toBe(0);
  });

  it('serializes simultaneous confirmations so only one selection can take the remaining seats', async () => {
    const first = await reserve(3);
    const second = await reserve(3, otherUserToken);
    const results = await Promise.all([
      resolve([first.id]),
      resolve([second.id]),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const count = await prisma.reservationParticipant.count({
      where: { reservation: { status: 'CONFIRMED' } },
    });
    expect(count).toBe(3);
  });

  it('requires cancellation reasons, releases capacity and never reopens cancelled bookings', async () => {
    const booking = await reserve(4);
    await resolve([booking.id]).expect(200);
    await resolve([booking.id], 'CANCEL').expect(400);
    await resolve([booking.id], 'CANCEL', 'Mau tempo').expect(200);
    await resolve([booking.id], 'CONFIRM').expect(409);
    const other = await reserve(4, otherUserToken);
    await resolve([other.id]).expect(200);
    const stored = await prisma.reservation.findUnique({
      where: { id: booking.id },
    });
    expect(stored.cancellationReason).toBe('Mau tempo');
  });

  it('lets tourists cancel only their own reservations before departure', async () => {
    const booking = await reserve();
    await request(app.getHttpServer())
      .patch(`/usuario/reservas/${booking.id}/cancelar`)
      .auth(otherUserToken, { type: 'bearer' })
      .send({ reason: 'Desistência' })
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/usuario/reservas/${booking.id}/cancelar`)
      .auth(userToken, { type: 'bearer' })
      .send({ reason: 'Desistência' })
      .expect(200);
    expect(
      (await prisma.reservation.findUnique({ where: { id: booking.id } }))
        .status
    ).toBe('CANCELLED');
  });

  it('requires confirmation and records boarding by individual passenger without cancelling boarded bookings', async () => {
    const booking = await reserve(2);
    const ids = booking.participants.map((p) => p.id);
    await attendance(ids, 'BOARDED').expect(409);
    await resolve([booking.id]).expect(200);
    await attendance([ids[0], randomUUID()], 'BOARDED').expect(404);
    expect(
      await prisma.reservationParticipant.count({
        where: { attendance: 'BOARDED' },
      })
    ).toBe(0);
    await attendance([ids[0]], 'BOARDED').expect(200);
    const retry = await attendance([ids[0]], 'BOARDED').expect(200);
    expect(retry.body.changed).toBe(0);
    await attendance([ids[1]], 'NO_SHOW').expect(409);
    await resolve([booking.id], 'CANCEL', 'Desistência').expect(409);
    const events = await request(app.getHttpServer())
      .get(`${supplierPath()}/reservas/${booking.id}/historico`)
      .auth(supplierToken, { type: 'bearer' })
      .expect(200);
    expect(
      events.body.items.filter((e) => e.action === 'ATTENDANCE_RECORDED')
    ).toHaveLength(1);
    expect(events.body.items.every((e) => e.actorId)).toBe(true);
  });

  it('closes completed departures only after resolving bookings and attendance', async () => {
    const booking = await reserve(2);
    await resolve([booking.id]).expect(200);
    await prisma.tourDeparture.update({
      where: { id: departureId },
      data: { startsAt: new Date(Date.now() - 3600000) },
    });
    const close = () =>
      request(app.getHttpServer())
        .patch(`${supplierPath()}/status`)
        .auth(supplierToken, { type: 'bearer' })
        .send({ status: 'COMPLETED' });
    await close().expect(409);
    await attendance([booking.participants[0].id], 'BOARDED').expect(200);
    await attendance([booking.participants[1].id], 'NO_SHOW').expect(200);
    await close().expect(200);
    await attendance([booking.participants[1].id], 'BOARDED').expect(409);
    await resolve([booking.id], 'CANCEL', 'Desistência').expect(409);
  });

  it('cancels an entire departure atomically and preserves reservation history', async () => {
    const first = await reserve(2);
    const second = await reserve(1, otherUserToken);
    await resolve([first.id]).expect(200);
    await request(app.getHttpServer())
      .patch(`${supplierPath()}/status`)
      .auth(supplierToken, { type: 'bearer' })
      .send({ status: 'CANCELLED', reason: 'Mau tempo' })
      .expect(200);
    expect(
      await prisma.reservation.count({ where: { status: 'CANCELLED' } })
    ).toBe(2);
    expect(
      await prisma.reservationEvent.count({
        where: { action: 'DEPARTURE_CANCELLED' },
      })
    ).toBe(2);
    expect(await prisma.reservationParticipant.count()).toBe(3);
    await resolve([second.id], 'CONFIRM').expect(409);
  });

  it('aggregates reservations and actual passengers without double-counting, using the departure local day', async () => {
    const booking = await reserve(3);
    await resolve([booking.id]).expect(200);
    await prisma.tourDeparture.update({
      where: { id: departureId },
      data: {
        startsAt: new Date('2026-01-16T01:00:00Z'),
        timeZone: 'America/Maceio',
      },
    });
    await attendance(
      booking.participants.slice(0, 2).map((p) => p.id),
      'BOARDED'
    ).expect(200);
    await attendance([booking.participants[2].id], 'NO_SHOW').expect(200);
    const url = '/provedor/painel/reservas?from=2026-01-15&to=2026-01-15';
    const before = await request(app.getHttpServer())
      .get(url)
      .auth(supplierToken, { type: 'bearer' })
      .expect(200);
    expect(before.body.totals.totalReservations).toBe(1);
    expect(before.body.totals.confirmedParticipants).toBe(3);
    expect(before.body.totals.boardedParticipants).toBe(2);
    expect(before.body.totals.completedParticipants).toBe(0);
    await request(app.getHttpServer())
      .patch(`${supplierPath()}/status`)
      .auth(supplierToken, { type: 'bearer' })
      .send({ status: 'COMPLETED' })
      .expect(200);
    const after = await request(app.getHttpServer())
      .get(url)
      .auth(supplierToken, { type: 'bearer' })
      .expect(200);
    expect(after.body.totals.completedParticipants).toBe(2);
    expect(after.body.byDateAndProduct[0].date).toBe('2026-01-15');
    const other = await request(app.getHttpServer())
      .get(url)
      .auth(otherSupplierToken, { type: 'bearer' })
      .expect(200);
    expect(other.body.totals.totalReservations).toBe(0);
    const wrongDay = await request(app.getHttpServer())
      .get('/provedor/painel/reservas?from=2026-01-16&to=2026-01-16')
      .auth(supplierToken, { type: 'bearer' })
      .expect(200);
    expect(wrongDay.body.totals.totalReservations).toBe(0);
  });

  it('prevents destructive deletes from erasing booking history', async () => {
    await reserve();
    await expect(
      prisma.product.delete({ where: { id: productId } })
    ).rejects.toMatchObject({ code: 'P2003' });
    await expect(
      prisma.user.delete({ where: { id: userId } })
    ).rejects.toMatchObject({ code: 'P2003' });
    await request(app.getHttpServer())
      .delete('/provedor/excluir')
      .auth(supplierToken, { type: 'bearer' })
      .expect(409);
    expect(await prisma.reservation.count()).toBe(1);
  });

  it('protects existing user/admin routes that could compromise reservation identities', async () => {
    await request(app.getHttpServer())
      .put(`/usuario/atualizar/${userId}`)
      .auth(otherUserToken, { type: 'bearer' })
      .send({ password: 'Invasor@1234' })
      .expect(404);
    await request(app.getHttpServer())
      .post('/admin/cadastro')
      .send({
        name: 'Invasor',
        email: 'admin@test.example',
        password: 'Senha@1234',
      })
      .expect(401);
    await request(app.getHttpServer()).get('/usuario/buscar/todos').expect(401);
    await request(app.getHttpServer())
      .post('/usuario/auth/google/test')
      .send({ email: 'ana@test.example', googleId: 'fake', name: 'Invasor' })
      .expect(404);
    await request(app.getHttpServer())
      .post('/usuario/cadastro')
      .send({
        name: 'Invasor',
        email: 'new@test.example',
        password: 'Senha@1234',
        cpf: '12345678901',
        birthday: '1990-01-01',
        phoneNumber: '82977777777',
        address: 'Maceió',
        role: 'Supplier',
      })
      .expect(400);
  });

  it('renews user access with the right subject and rejects revoked refresh tokens', async () => {
    const login = await request(app.getHttpServer())
      .post('/usuario/login')
      .send({ email: 'ana@test.example', password: 'Teste@1234' })
      .expect(201);
    const renewed = await request(app.getHttpServer())
      .post('/usuario/relogar')
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);
    expect(auth.validateAccessToken(renewed.body.accessToken).sub).toBe(userId);
    await prisma.userJWTs.deleteMany({ where: { userId } });
    await request(app.getHttpServer())
      .post('/usuario/relogar')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('consumes password recovery tokens once and revokes stored sessions', async () => {
    await prisma.userJWTs.create({
      data: {
        token: 'reset-token-for-test',
        userId,
        type: 'reset',
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    await prisma.userJWTs.create({
      data: {
        token: 'old-session',
        userId,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const dto = {
      token: 'reset-token-for-test',
      newPassword: 'Nova@1234',
      confirmPassword: 'Nova@1234',
    };
    const response = await request(app.getHttpServer())
      .put('/usuario/reset-password')
      .send(dto)
      .expect(200);
    expect(response.body.user).toBeUndefined();
    expect(await prisma.userJWTs.count({ where: { userId } })).toBe(0);
    expect(
      await bcrypt.compare(
        'Nova@1234',
        (await prisma.user.findUnique({ where: { id: userId } })).password
      )
    ).toBe(true);
    await request(app.getHttpServer())
      .put('/usuario/reset-password')
      .send(dto)
      .expect(400);
  });

  it('filters departures by a half-open time interval and closes availability after cancellation', async () => {
    const current = await prisma.tourDeparture.findUnique({
      where: { id: departureId },
    });
    const result = await request(app.getHttpServer())
      .get('/provedor/saidas')
      .auth(supplierToken, { type: 'bearer' })
      .query({
        startsFrom: current.startsAt.toISOString(),
        startsBefore: new Date(current.startsAt.getTime() + 1000).toISOString(),
      })
      .expect(200);
    expect(result.body.total).toBe(1);
    expect(result.body.items[0].acceptsReservations).toBe(true);
    const before = await request(app.getHttpServer())
      .get('/provedor/saidas')
      .auth(supplierToken, { type: 'bearer' })
      .query({ startsBefore: current.startsAt.toISOString() })
      .expect(200);
    expect(before.body.total).toBe(0);
    await request(app.getHttpServer())
      .patch(`${supplierPath()}/status`)
      .auth(supplierToken, { type: 'bearer' })
      .send({ status: 'CANCELLED', reason: 'Mau tempo' })
      .expect(200);
    const closed = await request(app.getHttpServer())
      .get('/provedor/saidas')
      .auth(supplierToken, { type: 'bearer' })
      .expect(200);
    expect(closed.body.items[0].availableSeats).toBe(0);
    expect(closed.body.items[0].acceptsReservations).toBe(false);
  });

  it('exposes only aggregate availability in the public catalog and bounds pagination', async () => {
    const booking = await reserve();
    await resolve([booking.id]).expect(200);
    const catalog = await request(app.getHttpServer())
      .get('/passeios/saidas?limit=1')
      .expect(200);
    expect(catalog.body.items[0].availableSeats).toBe(2);
    expect(JSON.stringify(catalog.body)).not.toContain('Ana Responsável');
    expect(JSON.stringify(catalog.body)).not.toContain('Turista 1');
    await request(app.getHttpServer())
      .get('/passeios/saidas?limit=101')
      .expect(400);
  });
});
