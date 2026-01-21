import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertiesDto } from './dto/filter-properties.dto';
import { Prisma, PropertyStatus } from '../generated/prisma/client';
import { PaginatedResult } from '../common/interfaces/paginated.interface';
import { PropertyResponse } from './entities/property-response.entity';
import { ImagesService } from '../images/images.service';

@Injectable()
export class PropertiesService {
    constructor(
        private prisma: PrismaService,
        private imagesService: ImagesService,
    ) { }

    async create(createPropertyDto: CreatePropertyDto, userId: string, files?: Express.Multer.File[]) {
        const property = await this.prisma.property.create({
            data: {
                ...createPropertyDto,
                ownerId: userId,
            },
        });

        // ✅ FIXED: Explicit typing + Prisma select
        const uploadedImages: { id: string; url: string; publicId: string }[] = [];

        if (files?.length) {
            for (const file of files) {
                const result: any = await this.imagesService['cloudinary'].uploadImage(file, 'properties');
                const image = await this.prisma.image.create({
                    data: {
                        url: result.secure_url,
                        publicId: result.public_id,
                        propertyId: property.id,
                    },
                    select: {  // ✅ FIXED: Explicitly select publicId
                        id: true,
                        url: true,
                        publicId: true,
                    }
                });
                
                uploadedImages.push({
                    id: image.id,
                    url: image.url,
                    publicId: image.publicId,  // ✅ NO ERROR
                });
            }
        }

        return this.findOne(property.id);
    }

    private async createWithImages(dto: CreatePropertyDto, ownerId: string, files: Express.Multer.File[]) {
        const property = await this.prisma.property.create({
            data: { ...dto, ownerId },
            include: {
                owner: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        // ✅ FIXED: Explicit typing
        const uploadedImages: any[] = [];
        for (const file of files.slice(0, 10)) {
            const result: any = await this.imagesService['cloudinary'].uploadImage(file, 'properties');
            const image = await this.prisma.image.create({
                data: {
                    url: result.secure_url,
                    propertyId: property.id,
                    publicId: result.public_id,
                },
                select: {  // ✅ FIXED: Explicitly select publicId
                    id: true,
                    url: true,
                    publicId: true,
                }
            });
            uploadedImages.push(image);
        }

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

    async findAll(filter: FilterPropertiesDto): Promise<PaginatedResult<PropertyResponse>> {
        const {
            page = 1,
            limit = 12,
            status,
            minPrice,
            maxPrice,
            location
        } = filter;

        const skip = (page - 1) * limit;
        const take = Math.min(limit, 100);

        const where: Prisma.PropertyWhereInput = {
            deletedAt: null,
            ...(status && { status }),
            ...(location && {
                location: {
                    contains: location,
                    mode: 'insensitive'
                }
            }),
            ...(minPrice && { price: { gte: minPrice } }),
            ...(maxPrice && { price: { lte: maxPrice } }),
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
            pagination: {
                page,
                limit: take,
                total,
                pages: Math.ceil(total / take),
            },
        };
    }

    async findOne(id: string): Promise<PropertyResponse> {
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

        return this.formatPropertyResponse(property);
    }

    async update(id: string, dto: UpdatePropertyDto, userId: string) {
        const property = await this.prisma.property.findUnique({
            where: { id }
        });

        if (!property || property.ownerId !== userId) {
            throw new ForbiddenException('Not authorized to update this property');
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

    async softDelete(id: string, userId: string) {
        const property = await this.prisma.property.findUnique({ where: { id } });

        if (!property || property.ownerId !== userId) {
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
