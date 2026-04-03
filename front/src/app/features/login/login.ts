import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { LoginService } from './login.service';
import { MailService } from '../company-settings/mail-settings/mail.service';
import { MessageService } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    FormsModule,
    TranslatePipe,],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private translate = inject(TranslateService);
  username = '';
  password = '';

  constructor(
    private auth: LoginService,
    private messageService: MessageService,
  ) { }

  recoverPassword(): void {
    if (!this.username?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('COMMON_LABELS.ERROR'),
        detail: this.translate.instant('LOGIN.RECOVER_USERNAME_REQUIRED')
      });
      return;
    }

    this.auth.requestPasswordReset(this.username.trim()).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('COMMON_LABELS.SUCCESS'),
          detail: this.translate.instant('LOGIN.RECOVER_PASSWORD_SUCCESS')
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('COMMON_LABELS.ERROR'),
          detail: err.error?.message || this.translate.instant('LOGIN.RECOVER_PASSWORD_ERROR')
        });
      }
    });
  }

  login() {
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.auth.sendToMap(),
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('COMMON_LABELS.ERROR'),
          detail: err.error.message || this.translate.instant('COMMON_LABELS.UNKNOWN_ERROR'),
        });
      },
    });
  }

  return() {
    this.auth.sendToMap();
  }
}
