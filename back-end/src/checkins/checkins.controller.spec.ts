import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CheckInsController } from './checkins.controller';
import { CheckInsService } from './checkins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const user = { id: 'user-1', email: 'a@b.com', role: 'MEMBER' };

const body = {
  completedGoal: true,
  results: 'r',
  commitments: 'c',
  wins: 'w',
  frictions: 'f',
};

describe('CheckInsController', () => {
  let app: INestApplication;
  const checkIns = { create: jest.fn(), list: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckInsController],
      providers: [{ provide: CheckInsService, useValue: checkIns }],
    })
      // Bypass the real JWT guard; attach a fixed user like the strategy would.
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = user;
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates using the authenticated user id', async () => {
    checkIns.create.mockResolvedValue({ id: 'c1' });

    await request(app.getHttpServer()).post('/checkins').send(body).expect(201);

    expect(checkIns.create).toHaveBeenCalledWith('user-1', body);
  });

  it('rejects a body with unknown fields', async () => {
    await request(app.getHttpServer())
      .post('/checkins')
      .send({ ...body, userId: 'someone-else' })
      .expect(400);

    expect(checkIns.create).not.toHaveBeenCalled();
  });

  it('rejects a non-boolean completedGoal', async () => {
    await request(app.getHttpServer())
      .post('/checkins')
      .send({ ...body, completedGoal: 'yes' })
      .expect(400);
  });

  it('defaults to the caller-only list when mine is absent', async () => {
    checkIns.list.mockResolvedValue([]);

    await request(app.getHttpServer()).get('/checkins').expect(200);

    expect(checkIns.list).toHaveBeenCalledWith('user-1', true);
  });

  it('returns the squad list when mine=false', async () => {
    checkIns.list.mockResolvedValue([]);

    await request(app.getHttpServer()).get('/checkins?mine=false').expect(200);

    expect(checkIns.list).toHaveBeenCalledWith('user-1', false);
  });

  it.each(['maybe', '', '0'])(
    'rejects mine=%p rather than widening the scope',
    async (value) => {
      await request(app.getHttpServer())
        .get(`/checkins?mine=${value}`)
        .expect(400);

      expect(checkIns.list).not.toHaveBeenCalled();
    },
  );
});
