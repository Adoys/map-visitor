import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { userId, password, role, email } = createUserDto;

    const existingUser = await this.userRepo.findOne({ where: { userId } });
    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    const existingEmail = await this.userRepo.findOne({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepo.create({
      userId,
      password: hashedPassword,
      role,
      email,
    });
    return this.userRepo.save(newUser);
  }

  async findByUserId(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { userId } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async updateProfile(id: number, dto: UpdateUserDto) {
    await this.userRepo.update(id, dto);
    return this.userRepo.findOne({ where: { id } });
  }

  async delete(id: number) {
    return this.userRepo.delete(id);
  }

  async changePassword(id: number, password: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) {
      throw new UnauthorizedException();
    }

    const hashed = await bcrypt.hash(password, 10);

    await this.userRepo.update(id, { password: hashed });
  }
}
