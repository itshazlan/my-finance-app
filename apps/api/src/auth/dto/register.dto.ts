import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6) // Password minimal 6 karakter
    password: string;

    @IsString()
    @IsOptional()
    name?: string;
}