import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmtpController } from './smtp.controller';
import { SmtpService } from './smtp.service';
import { Smtp } from './entities/smtp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Smtp])],
  controllers: [SmtpController],
  providers: [SmtpService],
  exports: [SmtpService],
})
// eslint-disable-next-line prettier/prettier
export class SmtpModule { }
