import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { Prisma, Role, User } from '@prisma/client';
import { PaginatedUsersResponse, UserResponse, PaginationMeta } from './entities/paginated-users.entity';


export interface PaginatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  deletedAt?: Date | null;
  propertiesCount: number;
  favoritesCount: number;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findAll(
    query: QueryUsersDto,
    isAdmin: boolean,
    currentUserId?: string
  ): Promise<PaginatedUsersResponse> {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      includeDeleted = false,
      search,
      minProperties,
      maxProperties,
      minFavorites,
      maxFavorites,
      me = false
    } = query || {};

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    // Base where clause (without count filters)
    let baseWhere: Prisma.UserWhereInput = {
      ...(isAdmin && includeDeleted ? {} : { deletedAt: null }),
      ...(currentUserId ? { id: currentUserId } : {}),
      ...(role && { role }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // First get all matching users (max 100), then filter by counts
    const allMatchingUsers = await this.prisma.user.findMany({
      where: baseWhere,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        deletedAt: isAdmin ? true : false,
        _count: {
          select: {
            properties: true,
            favorites: true
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ✅ Client-side count filtering
    let filteredUsers = allMatchingUsers;
    if (minProperties !== undefined) {
      filteredUsers = filteredUsers.filter(u => Number(u._count.properties) >= Number(minProperties));
    }
    if (maxProperties !== undefined) {
      filteredUsers = filteredUsers.filter(u => Number(u._count.properties) <= Number(maxProperties));
    }
    if (minFavorites !== undefined) {
      filteredUsers = filteredUsers.filter(u => Number(u._count.favorites) >= Number(minFavorites));
    }
    if (maxFavorites !== undefined) {
      filteredUsers = filteredUsers.filter(u => Number(u._count.favorites) <= Number(maxFavorites));
    }

    // Apply pagination
    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(skip, skip + take);

    const users: UserResponse[] = paginatedUsers.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      deletedAt: user.deletedAt ?? null,
      propertiesCount: Number(user._count.properties),
      favoritesCount: Number(user._count.favorites),
    }));

    return {
      data: users,
      pagination: {
        page,
        limit: take,
        total,
        pages: Math.ceil(total / take),
      } as PaginationMeta,
    };
  }


  /** ADMIN: Get single user (sees soft deleted) */
  async findOne(id: string, includeDeleted: boolean = false): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        deletedAt: true,
        _count: {
          select: {
            properties: includeDeleted ? true : { where: { deletedAt: null } },
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Block soft deleted for non-admin
    if (!includeDeleted && user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      deletedAt: user.deletedAt ?? null,
      propertiesCount: Number(user._count.properties),
      favoritesCount: Number(user._count.favorites),
    };
  }

  /** ANY USER: Get own profile (no soft delete access) - DEPRECATED, use findAll with currentUserId */
  async findProfile(userId: string): Promise<UserResponse> {
    const result = await this.findAll({} as QueryUsersDto, false, userId);
    if (result.data.length === 0) {
      throw new NotFoundException('User profile not found');
    }
    return result.data[0];
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        deletedAt: true,
        _count: {
          select: { properties: true, favorites: true },
        },
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      deletedAt: updatedUser.deletedAt ?? null,
      propertiesCount: Number(updatedUser._count.properties),
      favoritesCount: Number(updatedUser._count.favorites),
    };
  }

  /** ADMIN: Soft delete user */
  async softDelete(id: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      },
    });

    return { message: `User "${user.email}" soft deleted successfully` };
  }

  /** ADMIN: Restore soft deleted user */
  async restore(id: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: { not: null }
      }
    });

    if (!user) {
      throw new NotFoundException(`Soft deleted user with ID "${id}" not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        isActive: true
      },
    });

    return { message: `User "${user.email}" restored successfully` };
  }

  /** ADMIN: Permanently delete user */
  async forceDelete(id: string): Promise<{ message: string }> {
    await this.prisma.user.delete({ where: { id } });
    return { message: `User permanently deleted` };
  }

}

