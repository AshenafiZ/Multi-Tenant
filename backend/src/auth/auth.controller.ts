import { Controller, Post, Body, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AuthResponseDto } from './dto/response.dto';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  
  @Post('login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate with email and password. Returns JWT access token and refresh token.'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Request() req): Promise<AuthResponseDto> {
    return this.authService.login(req.user);  
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register new user',
    description: 'Create a new user or owner account. Admin accounts must be created by existing admins.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User registered successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', example: 'john.doe@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', enum: ['user', 'owner'], example: 'owner' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'User already exists or validation error' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('bootstrap')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create first admin (no auth required)',
    description: 'Bootstrap endpoint to create the very first admin account. Only works if no admin exists in the database. After creating the first admin, use /auth/admin endpoint (requires admin authentication) to create additional admins.'
  })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({ 
    status: 201, 
    description: 'First admin created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'First admin created successfully! You can now use this account to create additional admins.' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', example: 'admin@example.com' },
            firstName: { type: 'string', example: 'Admin' },
            lastName: { type: 'string', example: 'User' },
            role: { type: 'string', enum: ['admin'], example: 'admin' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Admin already exists or user with email already exists' })
  bootstrapAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.authService.bootstrapAdmin(createAdminDto);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create admin/user/owner (requires admin authentication)',
    description: 'Create a new user with any role (admin, owner, or user). Requires JWT token from an existing admin account. Use the Authorization header: Bearer <token>'
  })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Admin user created successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', example: 'newuser@example.com' },
            firstName: { type: 'string', example: 'New' },
            lastName: { type: 'string', example: 'User' },
            role: { type: 'string', enum: ['admin', 'owner', 'user'], example: 'owner' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can create users' })
  @ApiResponse({ status: 400, description: 'User already exists or validation error' })
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.authService.createAdmin(createAdminDto);
  }
}
