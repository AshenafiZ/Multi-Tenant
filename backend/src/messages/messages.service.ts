import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, MarkAsReadDto } from './dto/create-message.dto';
import { PaginatedMessages, InboxMessageListItem, SentMessageListItem } from './types';   

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async createMessage(dto: CreateMessageDto, senderId: string) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
      select: { id: true }
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      select: { id: true, deletedAt: true }
    });

    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found or deleted');
    }

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        propertyId: dto.propertyId,
        content: dto.content,
      },
      include: {
        sender: { select: { firstName: true } },
        receiver: { select: { firstName: true } },
        property: { select: { title: true } }
      }
    });

    return {
      message: {
        id: message.id,
        content: message.content,
        isRead: message.isRead,
        senderFirstName: message.sender.firstName,
        receiverFirstName: message.receiver.firstName,
        propertyTitle: message.property.title,
        createdAt: message.createdAt,
      }
    };
  }

  async findInbox(
    receiverId: string, 
    page: number = 1, 
    limit: number = 20, 
    propertyId?: string
  ): Promise<PaginatedMessages> {
    const skip = (page - 1) * limit;
    
    const where: any = {
      receiverId,
      deletedAt: null,
      property: { deletedAt: null }
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const [rawMessages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          sender: { select: { firstName: true, lastName: true } },
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              images: { where: { deletedAt: null }, take: 1, select: { url: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where })
    ]);

    // Map to InboxMessageListItem shape
    const messages: InboxMessageListItem[] = rawMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      isRead: msg.isRead,
      createdAt: msg.createdAt,

      senderFirstName: msg.sender.firstName,
      senderLastName: msg.sender.lastName ?? null,

      property: {
        id: msg.property.id,
        title: msg.property.title,
        price: Number(msg.property.price),           // Decimal → number
        images: msg.property.images.map(i => i.url), // flatten to string[]
      }
    }));

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findSent(
    senderId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedMessages> {
    const skip = (page - 1) * limit;

    const [rawMessages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          senderId,
          deletedAt: null,
          property: { deletedAt: null }
        },
        include: {
          receiver: { select: { firstName: true, lastName: true } },
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              images: { where: { deletedAt: null }, take: 1, select: { url: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          senderId,
          deletedAt: null,
          property: { deletedAt: null }
        }
      })
    ]);

    // Map to SentMessageListItem shape
    const messages: SentMessageListItem[] = rawMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      isRead: msg.isRead,
      createdAt: msg.createdAt,

      receiverFirstName: msg.receiver.firstName,
      receiverLastName: msg.receiver.lastName ?? null,

      property: {
        id: msg.property.id,
        title: msg.property.title,
        price: Number(msg.property.price),           // Decimal → number
        images: msg.property.images.map(i => i.url), // flatten to string[]
      }
    }));

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUnreadCount(receiverId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        receiverId,
        isRead: false,
        deletedAt: null,
        property: { deletedAt: null }
      }
    });
  }

  async markAsRead(messageIds: string[]) {
    const result = await this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        deletedAt: null
      },
      data: { isRead: true }
    });

    return { updated: result.count };
  }

  async softDelete(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      select: { senderId: true, receiverId: true, deletedAt: true }
    });

    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new ForbiddenException('Not authorized to delete this message');
    }

    await this.prisma.message.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return { message: 'Message soft deleted successfully' };
  }
}