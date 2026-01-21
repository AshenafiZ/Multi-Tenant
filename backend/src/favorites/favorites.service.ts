import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async toggleFavorite(propertyId: string, userId: string, action: 'add' | 'remove') {
    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, deletedAt: true }
    });

    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found or deleted');
    }

    if (action === 'add') {
      // Check if already favorited (simple where - NO relations)
      const existingFavorite = await this.prisma.favorite.findFirst({
        where: { 
          userId: userId,
          propertyId: propertyId,
          deletedAt: null
        }
      });

      if (existingFavorite) {
        throw new ForbiddenException('Property already in favorites');
      }

      const favorite = await this.prisma.favorite.create({
        data: { 
          userId: userId,
          propertyId: propertyId 
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              images: {
                where: { deletedAt: null },
                take: 1,
                select: { url: true }
              }
            }
          }
        }
      });

      return {
        message: 'Added to favorites',
        favorite
      };
    } else {
      // ✅ FIXED: Simple deleteMany 
      const result = await this.prisma.favorite.deleteMany({
        where: {
          userId: userId,
          propertyId: propertyId,
          deletedAt: null
        }
      });

      if (result.count === 0) {
        throw new NotFoundException('Favorite not found');
      }

      return {
        message: 'Removed from favorites',
        count: result.count
      };
    }
  }

  async findUserFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: {
        userId: userId,
        deletedAt: null
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            price: true,
            status: true,
            images: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'asc' },
              take: 3
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getFavoritesCount(userId: string): Promise<number> {
    return this.prisma.favorite.count({
      where: {
        userId: userId,
        deletedAt: null
      }
    });
  }

  async hardDelete(userId: string, propertyId: string) {
    const result = await this.prisma.favorite.deleteMany({
      where: {
        userId: userId,
        propertyId: propertyId
      }
    });
    return { count: result.count };
  }
}
