import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { AppController } from './app.controller';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'supersecret' })],
  controllers: [AppController],
  providers: [PrismaService]
})
export class AppModule {}
