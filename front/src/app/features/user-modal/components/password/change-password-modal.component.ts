import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { User } from '../../models/users';
import { UserService } from '../../user.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-change-password-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    PasswordModule,
    TranslatePipe
  ],
  template: `
    <form [formGroup]="form" class="p-fluid" style=" width: 385px;">
      <div class="field">
        <label>{{ 'USERS.NEW_PASSWORD' | translate }}</label>
        <p-password
          formControlName="password"
          [toggleMask]="true"
          [feedback]="true"
          placeholder="{{ 'USERS.NEW_PASSWORD' | translate }}"
          style="margin-left: 20px;">
        </p-password>
      </div>

      <div class="flex justify-end gap-2 mt-4" style="margin-top: 21px;">
        <button
          pButton
          type="button"
          label="{{ 'COMMON_LABELS.CANCEL' | translate }}"
          class="p-button-text"
          (click)="ref.close(false)">
        </button>

        <button
          pButton
          type="submit"
          label="{{ 'COMMON_LABELS.SAVE' | translate }}"
          [disabled]="form.invalid"
          (click)="submit()">
        </button>
      </div>
    </form>
  `,
})
export class ChangePasswordModalComponent {
  private translate = inject(TranslateService);
  user!: User;

  form;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private messageService: MessageService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
  ) {
    this.user = this.config.data;
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  submit() {
    if (this.form.invalid) return;

    this.userService
      .changePassword(this.user.id, this.form.value.password!)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translate.instant('USERS.CHANGE_PASSWORD_SUCCESS'),
            detail: this.translate.instant('USERS.PASSWORD_CHANGE_DETAIL', { name: this.user.userId }),
          });
          this.ref.close(true);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translate.instant('COMMON_LABELS.ERROR'),
            detail: err.error?.message || this.translate.instant('USERS.PASSWORD_CHANGE_ERROR'),
          });
        },
      });
  }
}
