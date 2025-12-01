import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CompanySettingsService } from './shared/interfaces/company-settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('front');

  constructor(private companySettings: CompanySettingsService) {
  this.companySettings.loadSettings().subscribe();
}
}
