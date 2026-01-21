import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { PrismaModule } from './prisma/prisma.module';  
import { ImagesModule } from './images/images.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // Loads .env globally
    PrismaModule,  // Exports PrismaService globally
    UsersModule,
    AuthModule,
    PropertiesModule,
    ImagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
