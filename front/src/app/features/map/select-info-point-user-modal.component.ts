import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { User } from '../user-modal/models/users';

@Component({
  selector: 'app-select-info-point-user-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-info-point-user-modal.component.html',
  styleUrls: ['./select-info-point-user-modal.component.scss'],
})
export class SelectInfoPointUserModalComponent {
  readonly config = inject(DynamicDialogConfig);
  readonly ref = inject(DynamicDialogRef);
  selectedUserId: number | null = null;

  get users(): User[] {
    return (this.config.data?.users as User[]) || [];
  }

  confirm(): void {
    const selected = this.users.find((user) => user.id === this.selectedUserId);
    if (selected) {
      this.ref.close(selected);
    }
  }

  cancel(): void {
    this.ref.close();
  }
}
