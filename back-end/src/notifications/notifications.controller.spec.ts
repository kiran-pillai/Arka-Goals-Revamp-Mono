import { Test } from '@nestjs/testing';
import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('NotificationsController', () => {
  let app: INestApplication;
  const service = { list: jest.fn(), read: jest.fn(), readAll: jest.fn() };
  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest<{ user: { id: string } }>().user = {
            id: 'owner',
          };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });
  it('uses the authenticated recipient for pagination', async () => {
    service.list.mockResolvedValue({ items: [] });
    await request(app.getHttpServer())
      .get('/notifications?cursor=cursor&limit=5')
      .expect(200);
    expect(service.list).toHaveBeenCalledWith('owner', 'cursor', 5);
  });
  it('routes read-all to the snapshot acknowledgement', async () => {
    service.readAll.mockResolvedValue({ ok: true });
    await request(app.getHttpServer())
      .patch('/notifications/read-all')
      .send({ snapshot: 'snapshot' })
      .expect(200);
    expect(service.readAll).toHaveBeenCalledWith('owner', 'snapshot');
    expect(service.read).not.toHaveBeenCalled();
  });
  it('rejects an invalid read target', async () => {
    await request(app.getHttpServer())
      .patch('/notifications/invalid/read')
      .expect(400);
    expect(service.read).not.toHaveBeenCalled();
  });
  it('acknowledges a valid UUID for the authenticated recipient', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    await request(app.getHttpServer())
      .patch(`/notifications/${id}/read`)
      .expect(200);
    expect(service.read).toHaveBeenCalledWith('owner', id);
  });
});
