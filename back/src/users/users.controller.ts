import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from 'src/auth/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly usersService: UsersService) { }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @Roles('admin')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: number) {
    return this.usersService.delete(id);
  }

  @Patch('password/:id')
  @Roles('admin')
  changePassword(
    @Param('id') id: number,
    @Body() password: { password: string },
  ) {
    return this.usersService.changePassword(id, password.password);
  }
}
