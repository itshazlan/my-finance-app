import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

// We need to use dynamic imports for ESM mocking
const { AuthService } = await import('./auth.service.js');
const { PrismaService } = await import('../prisma/prisma.service.js');
const { JwtService } = await import('@nestjs/jwt');
const bcrypt = await import('bcrypt');

import { Test, TestingModule } from '@nestjs/testing';

describe('AuthService', () => {
    let service: any;
    let prisma: any;
    let mockedBcrypt: any = bcrypt;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn<any>(),
            create: jest.fn<any>(),
        },
    };

    const mockJwtService = {
        signAsync: jest.fn<any>(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get(AuthService);
        prisma = module.get(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should hash password and create a new user', async () => {
            const dto = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            const hashedPassword = 'hashed_password_abc';
            
            // Mock findUnique to return null (user doesn't exist)
            prisma.user.findUnique.mockResolvedValue(null);
            
            // Set mock return value
            mockedBcrypt.hash.mockResolvedValue(hashedPassword);

            // Mock prisma.user.create
            const createdUser = {
                id: 'uuid-123',
                email: dto.email,
                name: dto.name,
                createdAt: new Date(),
            };
            prisma.user.create.mockResolvedValue(createdUser);

            const result = await service.register(dto);

            // Verify password actually hashed
            expect(mockedBcrypt.hash).toHaveBeenCalledWith(dto.password, 10);

            // Verify db call with hashed password
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    email: dto.email,
                    password: hashedPassword,
                    name: dto.name,
                },
                select: expect.any(Object),
            });

            expect(result).toEqual(createdUser);
        });

        it('should throw BadRequestException if email already exists', async () => {
            const dto = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Existing User',
            };

            prisma.user.findUnique.mockResolvedValue({ id: '1' });

            await expect(service.register(dto)).rejects.toThrow('Email sudah digunakan');
        });
    });

    describe('login', () => {
        it('should return user and access token if credentials are valid', async () => {
            const dto = {
                email: 'test@example.com',
                password: 'password123',
            };

            const user = {
                id: 'uuid-123',
                email: dto.email,
                password: 'hashed_password',
                name: 'Test User',
            };

            prisma.user.findUnique.mockResolvedValue(user);
            mockedBcrypt.compare.mockResolvedValue(true);
            mockJwtService.signAsync.mockResolvedValue('fake_jwt_token');

            const result = await service.login(dto);

            expect(mockedBcrypt.compare).toHaveBeenCalledWith(dto.password, user.password);
            expect(result).toEqual({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                access_token: 'fake_jwt_token',
            });
        });

        it('should throw BadRequestException if password is invalid', async () => {
            const dto = {
                email: 'test@example.com',
                password: 'wrong_password',
            };

            const user = {
                id: 'uuid-123',
                email: dto.email,
                password: 'hashed_password',
            };

            prisma.user.findUnique.mockResolvedValue(user);
            mockedBcrypt.compare.mockResolvedValue(false);

            await expect(service.login(dto)).rejects.toThrow('Email atau password salah');
        });
    });
});
