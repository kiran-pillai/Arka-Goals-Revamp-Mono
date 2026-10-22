import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CelebrationsController } from './celebrations.controller';
import { CelebrationsService } from './celebrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('Celebrations API', () => {
  let app: INestApplication;
  const service = {
    give: jest.fn(),
    recipients: jest.fn(),
    dashboard: jest.fn(),
    leaderboard: jest.fn(),
  };
  const id = '11111111-1111-4111-8111-111111111111';
  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      controllers: [CelebrationsController],
      providers: [{ provide: CelebrationsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx) => {
          const req = ctx.switchToHttp().getRequest();
          if (req.headers['x-test-auth'] !== 'yes') return false;
          req.user = { id: 'caller' };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterEach(() => app.close());
  it('requires authentication', async () => {
    await request(app.getHttpServer())
      .get('/celebrations/dashboard')
      .expect(403);
    await request(app.getHttpServer())
      .post(`/checkins/${id}/kudos`)
      .expect(403);
    expect(service.give).not.toHaveBeenCalled();
  });
  it('uses the authenticated giver even when the body supplies a different giver', async () => {
    service.give.mockResolvedValue({ id: 'award' });
    await request(app.getHttpServer())
      .post(`/checkins/${id}/kudos`)
      .set('x-test-auth', 'yes')
      .send({ giverId: 'someone-else', slot: 3 })
      .expect(201);
    expect(service.give).toHaveBeenCalledWith('caller', id);
  });
  it('rejects malformed target IDs', async () => {
    await request(app.getHttpServer())
      .get('/checkins/invalid/kudos')
      .set('x-test-auth', 'yes')
      .expect(400);
    expect(service.recipients).not.toHaveBeenCalled();
  });
  it('scopes dashboard to the current user', async () => {
    service.dashboard.mockResolvedValue({});
    await request(app.getHttpServer())
      .get('/celebrations/dashboard')
      .set('x-test-auth', 'yes')
      .expect(200);
    expect(service.dashboard).toHaveBeenCalledWith('caller');
  });
});
