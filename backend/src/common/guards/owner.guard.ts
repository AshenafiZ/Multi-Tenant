import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const role = request.user?.role;
    
    let propertyId = request.params?.id || 
                    request.body?.propertyId || 
                    (request.body as any)?.propertyId;

    // ✅ Validate required data
    if (!userId) {
      throw new ForbiddenException('User authentication required');
    }

    if (!propertyId) {
      throw new BadRequestException('Property ID required');
    }

    // Admin bypass
    if (role === 'admin') {
      return true;
    }

    // ✅ Safe Prisma query
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId as string },
      select: { ownerId: true },
    });

    if (!property || property.ownerId !== userId) {
      throw new ForbiddenException('You can only manage your own properties');
    }

    return true;
  }
}
