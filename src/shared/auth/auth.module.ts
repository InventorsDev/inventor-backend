import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalUsersStrategy } from './strategies/local.users.strategy';
import { JwtUsersStrategy } from './strategies/jwt.users.strategy';
import { JwtAdminsStrategy } from './strategies/jwt.admins.strategy';
import { JwtUsersGuard } from './guards/jwt.users.guard';
import { LocalUsersGuard } from './guards/local.users.guard';
import { JwtAdminsGuard } from './guards/jwt.admins.guard';
import { DBModule } from '../schema';

@Module({
  imports: [
    DBModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRES },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    PassportModule,
    JwtModule,
    AuthService,
    LocalUsersStrategy,
    JwtUsersStrategy,
    JwtAdminsStrategy,
    JwtUsersGuard,
    JwtAdminsGuard,
    LocalUsersGuard,
  ],
  exports: [
    PassportModule,
    JwtModule,
    AuthService,
    LocalUsersStrategy,
    JwtUsersStrategy,
    JwtAdminsStrategy,
    JwtUsersGuard,
    JwtAdminsGuard,
    LocalUsersGuard,
  ],
})
export class AuthModule {}
