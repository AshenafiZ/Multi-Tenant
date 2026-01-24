import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertiesDto } from './dto/filter-properties.dto';
import { Prisma, PropertyStatus } from '@prisma/client';
import { PaginatedResult } from '../common/interfaces/paginated.interface';
import { PropertyResponse } from './entities/property-response.entity';
import { ImagesService } from '../images/images.service';

@Injectable()
export class PropertiesService {
    constructor(
        private prisma: PrismaService,
        private imagesService: ImagesService,
    ) { }

    async create(createPropertyDto: CreatePropertyDto, user: { userId: string; role: string }, files?: Express.Multer.File[]) {
        const property = await this.prisma.property.create({
            data: {
                ...createPropertyDto,
                ownerId: user.userId,
                status: 'draft' as PropertyStatus,
            },
        });

        if (files?.length) {
            await this.imagesService.uploadImagesForProperty(property.id, files);
        }

        return this.findOnePublicOrPrivate(property.id, user);
    }

    private async createWithImages(dto: CreatePropertyDto, ownerId: string, files: Express.Multer.File[]) {
        const property = await this.prisma.property.create({
            data: { ...dto, ownerId },
            include: {
                owner: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        await this.imagesService.uploadImagesForProperty(property.id, files.slice(0, 10));
        const propertyWithImages = await this.prisma.property.findUnique({
            where: { id: property.id },
            include: {
                owner: { select: { id: true, firstName: true, lastName: true, email: true } },
                images: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
                _count: { select: { favorites: true, messages: true } },
            },
        });

        return this.formatPropertyResponse(propertyWithImages);
    }
    async findAllPublished(
        filter: FilterPropertiesDto,
        userId?: string,
        isAdminRequest?: boolean
    ): Promise<PaginatedResult<PropertyResponse>> {
        const {
            page = 1,
            limit = 12,
            status,
            minPrice,
            maxPrice,
            location,
            minFavorites,
            maxMessages,
            my = false,
            admin = false
        } = filter || {};

        const skip = (page - 1) * limit;
        const take = Math.min(limit, 100);

        // ✅ FIXED: Dynamic status logic based on access level
        const effectiveStatus = isAdminRequest || my ? status : 'published';

        let baseWhere: Prisma.PropertyWhereInput = {
            ...(effectiveStatus && effectiveStatus !== 'published' ? { status: effectiveStatus } : {}),
            ...(userId && my ? { ownerId: userId } : {}),
            deletedAt: null,
            ...(location && {
                location: {
                    contains: location,
                    mode: 'insensitive'
                }
            }),
            ...(typeof minPrice === 'number' && { price: { gte: minPrice } }),
            ...(typeof maxPrice === 'number' && { price: { lte: maxPrice } }),
        };

        // Public users ONLY see published (ignore status param)
        if (!isAdminRequest && !my) {
            baseWhere.status = 'published';
        }

        const allMatchingProperties = await this.prisma.property.findMany({
            where: baseWhere,
            include: {
                owner: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                images: {
                    where: { deletedAt: null },
                    take: 5,
                    orderBy: { createdAt: 'asc' },
                },
                _count: { select: { favorites: true, messages: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Client-side count filtering
        let filteredProperties = allMatchingProperties;
        if (minFavorites !== undefined) {
            filteredProperties = filteredProperties.filter(p => Number(p._count.favorites) >= Number(minFavorites));
        }
        if (maxMessages !== undefined) {
            filteredProperties = filteredProperties.filter(p => Number(p._count.messages) <= Number(maxMessages));
        }

        const total = filteredProperties.length;
        const paginatedProperties = filteredProperties.slice(skip, skip + take);

        const formattedProperties = paginatedProperties.map(p => this.formatPropertyResponse(p));

        return {
            data: formattedProperties,
            pagination: {
                page,
                limit: take,
                total,
                pages: Math.ceil(total / take),
            },
        };
    }


    async findOnePublicOrPrivate(id: string, user: { userId: string; role: string } | null): Promise<PropertyResponse> {
        const property = await this.prisma.property.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                images: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'asc' },
                },
                _count: { select: { favorites: true, messages: true } },
            },
        });

        if (!property || property.deletedAt) {
            throw new NotFoundException('Property not found');
        }

        // Public can only see published properties
        if (property.status !== 'published') {
            const isOwner = !!user && property.ownerId === user.userId;
            const isAdmin = user?.role === 'admin';
            if (!isOwner && !isAdmin) {
                throw new NotFoundException('Property not found');
            }
        }

        return this.formatPropertyResponse(property);
    }

    async updateDraft(id: string, dto: UpdatePropertyDto, user: { userId: string; role: string }) {
        const property = await this.prisma.property.findUnique({
            where: { id }
        });

        if (!property || property.deletedAt) {
            throw new NotFoundException('Property not found');
        }

        const isOwner = property.ownerId === user.userId;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Not authorized to update this property');
        }

        if (property.status !== 'draft') {
            throw new ForbiddenException('Published properties cannot be edited');
        }

        const updatedProperty = await this.prisma.property.update({
            where: { id },
            data: dto,
            include: {
                owner: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                images: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'asc' },
                },
                _count: { select: { favorites: true, messages: true } },
            },
        });

        return this.formatPropertyResponse(updatedProperty);
    }

    async publish(id: string, user: { userId: string; role: string }) {
        const property = await this.prisma.property.findUnique({ where: { id } });

        if (!property || property.deletedAt) {
            throw new NotFoundException('Property not found');
        }

        const isOwner = property.ownerId === user.userId;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Not authorized to publish this property');
        }

        if (property.status !== 'draft') {
            throw new BadRequestException('Only draft properties can be published');
        }

        // Validation before publishing
        if (!property.title?.trim() || !property.description?.trim() || !property.location?.trim()) {
            throw new BadRequestException('Property must have title, description, and location before publishing');
        }
        if (Number(property.price) <= 0) {
            throw new BadRequestException('Property price must be greater than 0 before publishing');
        }

        const imagesCount = await this.prisma.image.count({
            where: { propertyId: id, deletedAt: null },
        });
        if (imagesCount < 1) {
            throw new BadRequestException('At least one image is required before publishing');
        }

        await this.prisma.$transaction(async (tx) => {
            // Re-check draft inside transaction to prevent races
            const fresh = await tx.property.findUnique({ where: { id }, select: { status: true, deletedAt: true } });
            if (!fresh || fresh.deletedAt) {
                throw new NotFoundException('Property not found');
            }
            if (fresh.status !== 'draft') {
                throw new BadRequestException('Only draft properties can be published');
            }
            await tx.property.update({
                where: { id },
                data: { status: 'published' as PropertyStatus },
            });
        });

        return this.findOnePublicOrPrivate(id, user);
    }

    async disable(id: string, user: { userId: string; role: string }) {
        if (user.role !== 'admin') {
            throw new ForbiddenException('Admin only');
        }

        const property = await this.prisma.property.findUnique({ where: { id } });
        if (!property || property.deletedAt) {
            throw new NotFoundException('Property not found');
        }

        await this.prisma.property.update({
            where: { id },
            data: {
                status: 'archived' as PropertyStatus
            },
        });

        return { message: 'Property disabled (archived) successfully' };
    }

    async softDelete(id: string, user: { userId: string; role: string }) {
        const property = await this.prisma.property.findUnique({ where: { id } });

        if (!property || property.deletedAt) {
            throw new NotFoundException('Property not found');
        }

        const isOwner = property.ownerId === user.userId;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Not authorized to delete this property');
        }

        await this.prisma.property.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                status: 'archived' as PropertyStatus
            },
        });

        return { message: 'Property soft deleted successfully' };
    }

    private formatPropertyResponse(property: any): PropertyResponse {
        return {
            id: property.id,
            title: property.title,
            description: property.description,
            location: property.location,
            price: Number(property.price),
            status: property.status,
            owner: property.owner,
            images: property.images || [],
            favoritesCount: Number(property._count.favorites),
            messagesCount: Number(property._count.messages),
            createdAt: property.createdAt,
            deletedAt: property.deletedAt ?? null,
        };
    }
}
