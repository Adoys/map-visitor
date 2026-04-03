import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompanySettingsModule } from './company-settings/company-settings.module';
import { CompanyLanguagesModule } from './company-languages/company-languages.module';
import { SmtpModule } from './smtp/smtp.module';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    CompanySettingsModule,
    CompanyLanguagesModule,
    SmtpModule,
    NotificationsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity.{ts,js}'],
        synchronize: false, // ⚠️ true, solo en desarrollo
      }),
    }),
  ],
})
// eslint-disable-next-line prettier/prettier
export class AppModule { }
