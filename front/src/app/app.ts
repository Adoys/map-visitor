import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from "primeng/toast";
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule, DynamicDialogModule, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [MessageService, DialogService, MessageService, ConfirmationService],
})
export class App {
  protected readonly title = signal('front');

  constructor() { }
}
