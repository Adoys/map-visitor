import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';

export type Status = 'basic' | 'danger' | 'info' | 'primary' | 'success' | 'warning';
@Component({
  selector: 'custom-button',
  imports: [NgClass],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  disabled = input<boolean>(false);
  status = input<Status>('basic');
  clickButton = output<void>();
  fullWidth = input<boolean>(false);

  onClick() {
    this.clickButton.emit();
  }
}
