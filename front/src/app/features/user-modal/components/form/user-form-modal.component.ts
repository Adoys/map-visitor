import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { UserService } from '../../user.service';
import { SelectModule } from 'primeng/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface Roles {
  name: string;
  code: string;
}

@Component({
  standalone: true,
  selector: 'app-usere-form-modal',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    TranslatePipe,
  ],
  providers: [],
  templateUrl: 'user-form-modal.component.html',
  styleUrl: 'user-form-modal.component.scss',
})
export class UserFormModalComponent implements OnInit {
  private translate = inject(TranslateService);

  form!: FormGroup;
  previewFlag: string | null = null;
  roles = [
    { name: this.translate.instant('USERS.ROLE_ADMIN'), code: 'admin' },
    { name: this.translate.instant('USERS.ROLE_SCREEN'), code: 'screen' },
  ];
  editMode = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private messageService: MessageService,
  ) { }

  ngOnInit() {
    const user = this.config.data;
    this.editMode = !!user;

    this.form = this.fb.group({
      userId: [user?.userId || '', Validators.required],
      email: [user?.email || '', Validators.required],
      role: [user?.role || '', Validators.required],
      password: [user?.password || '', Validators.required],
    });
  }

  submit() {
    const payload = this.form.value;

    const request$ = this.config.data
      ? this.userService.update(this.config.data.id, payload)
      : this.userService.create(payload);

    request$.subscribe({
      next: () => {
        this.ref.close(true);
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('COMMON_LABELS.SUCCESS'),
          detail: this.translate.instant('USERS.UPDATE_SUCCESS')
        });
      },
      error: (err) => {
          this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('COMMON_LABELS.ERROR'),
          detail: err.error?.message || this.translate.instant('USERS.SAVE_ERROR')
        });
      }
    });
  }
}
