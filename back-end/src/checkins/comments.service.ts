import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  addComment(
    userId: string,
    checkInId: string,
    text: string,
    mentionedUserIds: string[] = [],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const checkIn = await tx.checkIn.findUnique({ where: { id: checkInId } });
      if (!checkIn) throw new NotFoundException('Check-in not found.');
      const comment = await tx.comment.create({
        data: { userId, checkInId, text },
      });
      const mentionedUsers = mentionedUserIds.length
        ? await tx.user.findMany({
            where: { id: { in: [...new Set(mentionedUserIds)] } },
            select: { id: true, firstName: true, lastName: true },
          })
        : [];
      const recipients = new Map<string, string>();
      if (checkIn.userId !== userId) recipients.set(checkIn.userId, 'COMMENT');
      for (const user of mentionedUsers) {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
        const marker = `@${name}`;
        if (
          user.id !== userId &&
          name &&
          [...text.matchAll(/(?:^|\s)@/gu)].some((match) => {
            const start = match.index + match[0].length - 1;
            if (!text.startsWith(marker, start)) return false;
            return !/^[\p{L}\p{N}_]/u.test(text.slice(start + marker.length));
          })
        ) {
          recipients.set(user.id, 'MENTION');
        }
      }
      for (const [recipientId, kind] of recipients) {
        await tx.notification.create({
          data: { recipientId, commentId: comment.id, kind },
        });
      }
      return comment;
    });
  }

  listComments(checkInId: string) {
    return this.prisma.comment.findMany({
      where: { checkInId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            colorSlot: true,
          },
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
