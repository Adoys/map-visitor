import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FieldsetModule } from 'primeng/fieldset';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MailService } from './mail.service';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-mail-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    FieldsetModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
    TextareaModule,
    FormsModule,
    DialogModule,
  ],
  templateUrl: './mail-settings.html',
  styleUrl: './mail-settings.scss'
})
export class MailSettingsComponent implements OnInit {
  private translate = inject(TranslateService);

  form!: FormGroup;
  testing = false;
  showTestDialog = false;

  securityOptions = [
    { label: 'NONE', value: 'NONE' },
    { label: 'SSL', value: 'SSL' },
    { label: 'TLS', value: 'TLS' }
  ];

  constructor(
    private fb: FormBuilder,
    private mailService: MailService,
    private messageService: MessageService,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [null],
      host: ['', Validators.required],
      port: [587, [Validators.required, Validators.min(1)]],
      security: ['TLS', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      testEmail: ['', [Validators.email]],
    });

    this.mailService.find().subscribe({
      next: (mail) => {
        if (!mail) {
          return;
        }

        this.form.patchValue({
          id: mail.id ?? null,
          host: mail.host ?? '',
          port: mail.port ?? 587,
          security: mail.security ?? 'TLS',
          username: mail.username ?? '',
          password: mail.password ?? '',
          email: mail.email ?? '',
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('COMMON_LABELS.ERROR'),
          detail: err.error?.message || this.translate.instant('COMMON_LABELS.UNKNOWN_ERROR')
        });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value;
    const request = payload.id
      ? this.mailService.update(payload.id, payload)
      : this.mailService.create(payload);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('COMMON_LABELS.SUCCESS'),
          detail: this.translate.instant('SETTINGS.EMAIL.CREATE_SUCCESS')
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('COMMON_LABELS.ERROR'),
          detail: err.error?.message || this.translate.instant('SETTINGS.EMAIL.CREATE_ERROR')
        });
      }
    });

  }

  testConnection(): void {
    if (!this.form) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.form.get('testEmail')?.reset('');
    this.showTestDialog = true;
  }

  confirmTestConnection(): void {
    if (this.form.get('testEmail')?.invalid) {
      this.form.get('testEmail')?.markAsTouched();
      return;
    }

    this.testing = true;

    const smtp = this.form.getRawValue();
    const email = smtp.testEmail;

    this.mailService.testEmail(smtp, email).subscribe({
      next: () => {
        this.testing = false;
        this.showTestDialog = false;

        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('COMMON_LABELS.SUCCESS'),
          detail: this.translate.instant('SETTINGS.EMAIL.TEST_SUCCESS')
        });
      },
      error: (err) => {
        this.testing = false;

        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('COMMON_LABELS.ERROR'),
          detail:
            err.error?.message ||
            this.translate.instant('SETTINGS.EMAIL.TEST_ERROR')
        });
      }
    });
  }
}