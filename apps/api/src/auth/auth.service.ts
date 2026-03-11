import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) { }

    async register(dto: RegisterDto) {
        // 1. Cek apakah email sudah terdaftar
        const userExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (userExists) throw new BadRequestException('Email sudah digunakan');

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // 3. Simpan ke Database
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });

        return user;
    }

    async login(dto: any) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) throw new BadRequestException('Email atau password salah');

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) throw new BadRequestException('Email atau password salah');

        // Buat JWT Token
        const payload = { sub: user.id, email: user.email };
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}
