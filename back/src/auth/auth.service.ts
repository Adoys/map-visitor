/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SmtpService } from '../smtp/smtp.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { User } from 'src/users/user.entity';

@Injectable()
export class AuthService {
  MAX_ATTEMPTS = 5;
  LOCK_TIME = 15 * 60 * 1000; // 15 min

  constructor(
    private usersService: UsersService,
    private smtpService: SmtpService,
    private jwtService: JwtService,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async validateUser(userId: string, password: string): Promise<User> {
    const user = await this.usersService.findByUserId(userId);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 🔒 comprobar bloqueo
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new UnauthorizedException('Cuenta bloqueada temporalmente');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      user.loginAttempts += 1;

      // ⛔ bloquear si supera el límite
      if (user.loginAttempts >= this.MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + this.LOCK_TIME);
      }

      await this.usersService.updateProfile(user.id, user);

      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // ✅ login correcto → resetear
    user.loginAttempts = 0;
    user.lockUntil = null;

    await this.usersService.updateProfile(user.id, user);

    return user;
  }

  async forgotPassword(username: string): Promise<{ message: string }> {
    const user = await this.usersService.findByUserId(username);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const smtp = await this.smtpService.getSmtp();
    if (
      !smtp ||
      !smtp.host ||
      !smtp.port ||
      !smtp.username ||
      !smtp.password ||
      !smtp.email
    ) {
      throw new ServiceUnavailableException('servicio no disponible');
    }

    const newPassword = this.generateRandomPassword(12);
    await this.usersService.changePassword(user.id, newPassword);

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.security === 'SSL',
      auth: {
        user: smtp.username,
        pass: smtp.password,
      },
      ...(smtp.security === 'TLS'
        ? {
          requireTLS: true,
          tls: {
            rejectUnauthorized: false,
          },
        }
        : {}),
    });

    await transporter.sendMail({
      from: smtp.email,
      to: user.email,
      subject: 'Restablecimiento de contraseña',
      text: `Hola ${user.userId},\n\nTu nueva contraseña es: ${newPassword}\n\nPor favor, cámbiala después de iniciar sesión.`,
    });

    return {
      message: 'Se ha enviado un correo con la nueva contraseña',
    };
  }

  login(user: User) {
    const payload = { username: user.userId, role: user.role, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  private generateRandomPassword(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
