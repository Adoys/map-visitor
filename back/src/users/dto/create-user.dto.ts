/* eslint-disable prettier/prettier */
import { IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    userId: string;

    @IsString()
    @MinLength(6)
    @MaxLength(100)
    password: string;

    @IsString()
    @MinLength(6)
    @MaxLength(100)
    email: string;

    @IsEnum(UserRole)
    role?: UserRole = UserRole.ADMIN;
}
