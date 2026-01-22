import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/response.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export interface UserPayload {
  sub: string;
  email: string;
  role: Role; 
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ✅ LOGIN VALIDATION (called by LocalStrategy)
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password from response
    const { password: _, ...result } = user;
    return result;
  }

  // ✅ LOGIN (generates JWT tokens)
  async login(user: any): Promise<AuthResponseDto> {
    const payload: UserPayload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN') || '24h',
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  // ✅ PUBLIC REGISTER (user/owner only)
  async register(dto: RegisterDto): Promise<any> {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        id: require('crypto').randomUUID(),
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role as Role,
      },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true, 
        role: true,
        createdAt: true 
      },
    });

    return {
      message: 'User registered successfully',
      user,
    };
  }

  // ✅ ADMIN CREATE USER (admin/owner/user - admin only)
  async createAdmin(dto: CreateAdminDto): Promise<any> {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('User already exists');
    }

    // Validate admin role creation
    if (dto.role === 'admin') {
      // In production, add audit log here
      console.log(`Admin creating new admin: ${dto.email}`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        id: require('crypto').randomUUID(),
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role as Role,
      },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true, 
        role: true,
        createdAt: true 
      },
    });

    return {
      message: 'Admin user created successfully',
      user,
    };
  }

  // ✅ BOOTSTRAP: Create first admin (no auth required, only works if no admin exists)
  async bootstrapAdmin(dto: CreateAdminDto): Promise<any> {
    // Check if any admin already exists
    const existingAdmin = await this.prisma.user.findFirst({
      where: {
        role: 'admin',
        deletedAt: null,
      },
    });

    if (existingAdmin) {
      throw new BadRequestException(
        'Admin already exists. Use /auth/admin endpoint (requires admin authentication) to create additional admins.',
      );
    }

    // Check if user with this email exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create first admin
    const user = await this.prisma.user.create({
      data: {
        id: require('crypto').randomUUID(),
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'admin' as Role, // Force admin role for bootstrap
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: 'First admin created successfully! You can now use this account to create additional admins.',
      user,
    };
  }

  // ✅ GENERIC USER FINDER (used by strategies)
  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    }); 
  }
}
