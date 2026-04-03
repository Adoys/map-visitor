import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UserService } from '../../user.service';
import { UserFormModalComponent } from '../form/user-form-modal.component';
import { User } from '../../models/users';
import { ChangePasswordModalComponent } from '../password/change-password-modal.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-language-modal',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    TranslatePipe,
  ],
  providers: [],
  templateUrl: './user-modal.html',
  styleUrl: './user-modal.scss'
})
export class UserModalComponent {
  private translate = inject(TranslateService);
  users: User[] = [];
  loading = false;
  ref?: DynamicDialogRef | null;

  constructor(
    private userService: UserService,
    private dialogService: DialogService,
    private confirmation: ConfirmationService,
    private messageService: MessageService,
  ) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.findAll().subscribe({
      next: (data) => { this.users = data; this.loading = false; },
      error: (err) => { this.loading = false; }
    });
  }

  openCreateModal() {
    this.ref = this.dialogService.open(UserFormModalComponent, {
      header: this.translate.instant('USERS.ADD_USER'),
      width: 'auto',
      data: null
    });
    this.ref?.onClose.subscribe((changed) => { if (changed) this.loadUsers(); });
  }

  openEditModal(user: User) {
    this.ref = this.dialogService.open(UserFormModalComponent, {
      header: this.translate.instant('USERS.EDIT_USER'),
      width: 'auto',
      data: user
    });
    this.ref?.onClose.subscribe((changed) => { if (changed) this.loadUsers(); });
  }

  changePassword(user: User) {
    this.ref = this.dialogService.open(ChangePasswordModalComponent, {
      header: this.translate.instant('USERS.CHANGE_PASSWORD'),
      width: 'auto',
      data: user
    });
    this.ref?.onClose.subscribe((changed) => { if (changed) this.loadUsers(); });
  }

  confirmDelete(user: User) {
    this.confirmation.confirm({
      message: this.translate.instant('USERS.CONFIRM_DELETE', { name: user.userId }),
      acceptLabel: this.translate.instant('COMMON_LABELS.YES'),
      rejectLabel: this.translate.instant('COMMON_LABELS.NO'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userService.delete(user.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translate.instant('COMMON_LABELS.SUCCESS'),
              detail: this.translate.instant('USERS.DELETE_SUCCESS')
            });
            this.loadUsers();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: this.translate.instant('COMMON_LABELS.ERROR'),
              detail: err.error?.message || this.translate.instant('USERS.DELETE_ERROR')
            });
          }
        });
      }
    });
  }
}