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

    async findAllPublished(filter: FilterPropertiesDto): Promise<PaginatedResult<PropertyResponse>> {
        const {
            page = 1,
            limit = 12,
            minPrice,
            maxPrice,
            location
        } = filter;

        const skip = (page - 1) * limit;
        const take = Math.min(limit, 100);

        const where: Prisma.PropertyWhereInput = {
            deletedAt: null,
            status: 'published',
            ...(location && {
                location: {
                    contains: location,
                    mode: 'insensitive'
                }
            }),
            ...(typeof minPrice === 'number' && { price: { gte: minPrice } }),
            ...(typeof maxPrice === 'number' && { price: { lte: maxPrice } }),
        };

        const [properties, total] = await Promise.all([
            this.prisma.property.findMany({
                where,
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
                skip,
                take,
            }),
            this.prisma.property.count({ where }),
        ]);

        const formattedProperties = properties.map(p => this.formatPropertyResponse(p));

        return {
            data: formattedProperties,
            meta: {
                page,
                limit: take,
                total,
                totalPages: Math.ceil(total / take),
            },
        };
    }

    // Role-based property listing
    async findAllByRole(filter: FilterPropertiesDto, user: { userId: string; role: string } | null): Promise<PaginatedResult<PropertyResponse>> {
        try {
            const {
                page = 1,
                limit = 12,
                minPrice,
                maxPrice,
                location,
                status
            } = filter;

            const skip = (page - 1) * limit;
            const take = Math.min(limit, 100);

            let where: Prisma.PropertyWhereInput = {
                ...(location && {
                    location: {
                        contains: location,
                        mode: 'insensitive'
                    }
                }),
                ...(typeof minPrice === 'number' && { price: { gte: minPrice } }),
                ...(typeof maxPrice === 'number' && { price: { lte: maxPrice } }),
            };

            // Role-based filtering
            if (!user || user.role === 'user') {
                // Users can only see published properties
                where.deletedAt = null;
                where.status = 'published';
            } else if (user.role === 'owner') {
                // Owners can see published + their own draft properties
                where.deletedAt = null;
                where.OR = [
                    { status: 'published' },
                    { status: 'draft', ownerId: user.userId },
                ];
                if (status) {
                    where.status = status;
                    where.ownerId = user.userId; // If filtering by status, show only own properties
                }
            } else if (user.role === 'admin') {
                // Admin can see all properties (draft, published, archived, deleted)
                if (status) {
                    where.status = status;
                }
                // Admin can see deleted properties if explicitly requested
                if (filter.includeDeleted !== true) {
                    where.deletedAt = null;
                }
            }

            const [properties, total] = await Promise.all([
                this.prisma.property.findMany({
                    where,
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
                    skip,
                    take,
                }),
                this.prisma.property.count({ where }),
            ]);

            const formattedProperties = properties.map(p => this.formatPropertyResponse(p));

            return {
                data: formattedProperties,
                meta: {
                    page,
                    limit: take,
                    total,
                    totalPages: Math.ceil(total / take),
                },
            };
        } catch (error) {
            console.error('Error in findAllByRole:', error);
            throw error;
        }
    }

    // Get owner's own properties
    async findOwnerProperties(ownerId: string, filter: FilterPropertiesDto): Promise<PaginatedResult<PropertyResponse>> {
        const {
            page = 1,
            limit = 12,
            minPrice,
            maxPrice,
            location,
            status
        } = filter;

        const skip = (page - 1) * limit;
        const take = Math.min(limit, 100);

        const where: Prisma.PropertyWhereInput = {
            ownerId,
            deletedAt: null,
            ...(status && { status }),
            ...(location && {
                location: {
                    contains: location,
                    mode: 'insensitive'
                }
            }),
            ...(typeof minPrice === 'number' && { price: { gte: minPrice } }),
            ...(typeof maxPrice === 'number' && { price: { lte: maxPrice } }),
        };

        const [properties, total] = await Promise.all([
            this.prisma.property.findMany({
                where,
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
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            this.prisma.property.count({ where }),
        ]);

        const formattedProperties = properties.map(p => this.formatPropertyResponse(p));

        return {
            data: formattedProperties,
            meta: {
                page,
                limit: take,
                total,
                totalPages: Math.ceil(total / take),
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

    async updateDraft(id: string, dto: UpdatePropertyDto, user: { userId: string; role: string }, files?: Express.Multer.File[]) {
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

        // Owners can update their own properties (draft or published), admins can update any
        if (property.status === 'draft' || (isOwner && property.status === 'published') || isAdmin) {
            // Allow update
        } else {
            throw new ForbiddenException('Only draft properties or your own published properties can be edited');
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

        // Upload new images if provided
        if (files?.length) {
            await this.imagesService.uploadImagesForProperty(id, files);
            // Return updated property with new images
            return this.findOnePublicOrPrivate(id, user);
        }

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
            ownerId: property.ownerId, // Include ownerId for easier access
            owner: property.owner,
            images: property.images || [],
            favoritesCount: Number(property._count?.favorites || 0),
            messagesCount: Number(property._count?.messages || 0),
            createdAt: property.createdAt,
            deletedAt: property.deletedAt ?? null,
        };
    }
}
