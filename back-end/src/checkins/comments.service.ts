import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  addComment(userId: string, checkInId: string, text: string) {
    return this.prisma.comment.create({
      data: { userId, checkInId, text },
    });
  }

  listComments(checkInId: string) {
    return this.prisma.comment.findMany({
      where: { checkInId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, colorSlot: true },
        },
      },
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments.');
    }
    return this.prisma.comment.delete({ where: { id: commentId } });
  }
}
