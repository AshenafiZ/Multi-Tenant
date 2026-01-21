import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import { PaginationMeta } from '../entities/paginated-response.entity';

export const ApiPaginated = <T>(entityType: any) =>
  applyDecorators(
    ApiExtraModels(PaginationMeta),
    ApiResponse({
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: `#/components/schemas/${entityType.name}` },
          },
          pagination: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },
    }),
  );
