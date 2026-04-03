/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Smtp } from './entities/smtp.entity';
import { CreateSmtpDto } from './dto/create-smtp.dto';
import { UpdateSmtpDto } from './dto/update-smtp.dto';
import { TestSmtpDto } from './dto/test-smtp.dto';
import { encrypt } from '../utils/encrypt';
import { decrypt } from '../utils/decrypt';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class SmtpService {
  constructor(
    @InjectRepository(Smtp)
    private readonly repo: Repository<Smtp>,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async getSmtp() {
    const smtp = await this.repo.findOneBy({});
    if (!smtp) {
      return null;
    }

    return {
      ...smtp,
      password: smtp.password ? decrypt(smtp.password) : smtp.password,
    };
  }

  async create(dto: CreateSmtpDto) {
    const smtp = await this.repo.findOneBy({});
    const toSave = {
      ...dto,
      password: encrypt(dto.password),
    };

    if (!smtp) {
      return this.repo.save(toSave);
    }

    await this.repo.update(smtp.id, toSave);
    return this.repo.findOne({ where: { id: smtp.id } });
  }

  async update(id: number, dto: UpdateSmtpDto) {
    const dataToUpdate = {
      ...dto,
      ...(dto.password ? { password: encrypt(dto.password) } : {}),
    };

    await this.repo.update(id, dataToUpdate);
    const smtp = await this.repo.findOne({ where: { id } });

    if (!smtp) {
      return null;
    }

    return {
      ...smtp,
      password: smtp.password ? decrypt(smtp.password) : smtp.password,
    };
  }

  async delete(id: number) {
    return this.repo.delete(id);
  }

  async test(dto: TestSmtpDto) {
    const secure = dto.security === 'SSL';
    const transportOptions: SMTPTransport.Options = {
      host: dto.host,
      port: dto.port,
      secure,
      auth: {
        user: dto.username,
        pass: dto.password,
      },
      ...(dto.security === 'TLS'
        ? {
          requireTLS: true,
          tls: {
            rejectUnauthorized: false,
          },
        }
        : {}),
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const transporter = nodemailer.createTransport(
      transportOptions,
    ) as Transporter<SMTPTransport.SentMessageInfo>;

    try {
      // Verify login/connect
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await transporter.verify();

      // Send mail
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const result = await transporter.sendMail({
        from: dto.email,
        to: dto.testEmail,
        subject: 'SMTP test',
        text: 'This is a test email sent from the SMTP configuration screen.',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>SMTP configuration test</h2>
            <p>If you received this email, the SMTP configuration is working correctly.</p>
          </div>
        `,
      });

      return {
        success: true,
        message: 'Test email sent successfully',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        messageId: result.messageId,
      };
    } catch (error) {
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error?.message || 'Unable to connect to the SMTP server',
      );
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      transporter.close();
    }
  }
}
