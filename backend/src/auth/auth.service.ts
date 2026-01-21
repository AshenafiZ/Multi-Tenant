import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../generated/prisma/client';  

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async createAdmin(dto: CreateAdminDto): Promise<any> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existing) {
      throw new BadRequestException('Admin already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        id: require('crypto').randomUUID(),
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role as Role,  // Type assertion
      },
      select: { id: true, email: true, firstName: true, role: true }  // Don't return password
    });
  }

  async register(dto: RegisterDto): Promise<any> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        id: require('crypto').randomUUID(),
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role as Role,
      }, 
      select: { id: true, email: true, firstName: true, role: true }
    });
  }
}
