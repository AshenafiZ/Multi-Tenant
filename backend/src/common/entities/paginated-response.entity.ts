import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse , ApiProperty} from '@nestjs/swagger';

@ApiExtraModels()
export class PaginationMeta {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() pages: number;
}

export const ApiPaginatedResponse = <T>(entityType: any) =>
  applyDecorators(
    ApiExtraModels(PaginationMeta),
    ApiResponse({ 
      schema: { 
        type: 'object',
        properties: {
          data: { 
            type: 'array', 
            items: { $ref: `#/components/schemas/${entityType.name}` } 
          },
          pagination: { $ref: '#/components/schemas/PaginationMeta' }
        }
      }
    }),
  );
