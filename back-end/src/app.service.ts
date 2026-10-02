import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkHealth(): Promise<{ status: string; db: string; uptime: number }> {
    let db = 'up';
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      db = 'down';
    }
    return {
      status: db === 'up' ? 'healthy' : 'degraded',
      db,
      uptime: process.uptime(),
    };
  }
}
