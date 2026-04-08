import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-point-of-interest-modal',
  imports: [CommonModule],
  templateUrl: './point-of-interest-modal.component.html',
  styleUrl: './point-of-interest-modal.component.scss',
})
export class PointOfInterestModalComponent {
  readonly config = inject(DynamicDialogConfig);
  readonly point = this.config.data as {
    label: string;
    description: string;
    x: number;
    y: number;
  };
}
