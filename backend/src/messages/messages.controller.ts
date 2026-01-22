import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { CreateMessageDto, MarkAsReadDto } from './dto/create-message.dto';
import { PaginatedMessagesResponse } from './dto/paginated-response.dto';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new message' })
  @ApiOkResponse({ description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request (invalid data)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Receiver or property not found' })
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.createMessage(createMessageDto, user.userId);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get user inbox (received messages)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (starts from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of messages per page',
  })
  @ApiQuery({
    name: 'propertyId',
    required: false,
    type: String,
    description: 'Filter messages by property ID',
  })
  @ApiOkResponse({
    description: 'Paginated list of received messages',
    type: PaginatedMessagesResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findInbox(
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('propertyId') propertyId?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.messagesService.findInbox(
      user.userId,
      pageNum,
      limitNum,
      propertyId,
    );
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get user sent messages' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (starts from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of messages per page',
  })
  @ApiOkResponse({
    description: 'Paginated list of sent messages',
    type: PaginatedMessagesResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findSent(
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.messagesService.findSent(user.userId, pageNum, limitNum);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread messages' })
  @ApiOkResponse({
    description: 'Number of unread messages',
    type: Number,
    example: 7,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.messagesService.getUnreadCount(user.userId);
  }

  @Patch('read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark one or more messages as read' })
  @ApiOkResponse({ description: 'Messages marked as read' })
  @ApiResponse({ status: 400, description: 'Bad request (invalid message IDs)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(@Body() dto: MarkAsReadDto) {
    return this.messagesService.markAsRead(dto.messageIds);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Soft delete a message' })
  @ApiOkResponse({ description: 'Message soft-deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not sender or receiver' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.softDelete(id, user.userId);
  }
}