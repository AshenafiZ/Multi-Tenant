// import { applyDecorators, Type } from '@nestjs/common';
// import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

// @ApiExtraModels()
// export class PaginationMeta {
//   @ApiProperty()
//   page: number;

//   @ApiProperty()
//   limit: number;

//   @ApiProperty()
//   total: number;

//   @ApiProperty()
//   pages: number;
// }

// export class PaginatedResponse<T> {
//   @ApiProperty({ description: 'List of items' })
//   data: T[];

//   @ApiProperty({ type: PaginationMeta })
//   pagination: PaginationMeta;
// }

// export const ApiPaginatedResponse = <TModel>(model?: any) =>
//   applyDecorators(
//     ApiExtraModels(PaginationMeta),
//     ApiProperty({
//       description: 'Paginated response',
//       type: PaginatedResponse,
//       schema: {
//         allOf: [
//           {
//             properties: {
//               data: {
//                 type: 'array',
//                 items: { $ref: getSchemaPath(model || Object) },
//               },
//               pagination: { $ref: getSchemaPath(PaginationMeta) },
//             },
//           },
//         ],
//       },
//     }),
//   );

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
