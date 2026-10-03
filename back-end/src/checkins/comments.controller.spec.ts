import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';

const user = { id: 'user-1', email: 'a@b.com', role: 'MEMBER' };

describe('CommentsController', () => {
  let app: INestApplication;
  const comments = {
    addComment: jest.fn(),
    listComments: jest.fn(),
    deleteComment: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: comments }],
    })
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

  describe('POST /checkins/:checkInId/comments', () => {
    it('creates a comment with the authenticated user', async () => {
      comments.addComment.mockResolvedValue({ id: 'cmt-1' });

      await request(app.getHttpServer())
        .post('/checkins/checkin-1/comments')
        .send({ text: 'Nice work!' })
        .expect(201);

      expect(comments.addComment).toHaveBeenCalledWith(
        'user-1',
        'checkin-1',
        'Nice work!',
      );
    });

    it('rejects empty text', async () => {
      await request(app.getHttpServer())
        .post('/checkins/checkin-1/comments')
        .send({ text: '' })
        .expect(400);

      expect(comments.addComment).not.toHaveBeenCalled();
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/checkins/checkin-1/comments')
        .send({ text: 'hi', userId: 'hacker' })
        .expect(400);

      expect(comments.addComment).not.toHaveBeenCalled();
    });
  });

  describe('GET /checkins/:checkInId/comments', () => {
    it('returns comments for a check-in', async () => {
      const mockComments = [
        { id: 'cmt-1', text: 'Great!', userId: 'user-1', checkInId: 'checkin-1' },
      ];
      comments.listComments.mockResolvedValue(mockComments);

      const res = await request(app.getHttpServer())
        .get('/checkins/checkin-1/comments')
        .expect(200);

      expect(comments.listComments).toHaveBeenCalledWith('checkin-1');
      expect(res.body).toEqual(mockComments);
    });
  });

  describe('DELETE /checkins/:checkInId/comments/:commentId', () => {
    it('removes the caller\'s own comment', async () => {
      comments.deleteComment.mockResolvedValue({ id: 'cmt-1' });

      await request(app.getHttpServer())
        .delete('/checkins/checkin-1/comments/cmt-1')
        .expect(200);

      expect(comments.deleteComment).toHaveBeenCalledWith('user-1', 'cmt-1');
    });

    it('returns 403 for another user\'s comment', async () => {
      comments.deleteComment.mockRejectedValue(
        new ForbiddenException('You can only delete your own comments.'),
      );

      await request(app.getHttpServer())
        .delete('/checkins/checkin-1/comments/cmt-1')
        .expect(403);
    });
  });
});
