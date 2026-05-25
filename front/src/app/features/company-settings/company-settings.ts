import { Component, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TabsModule } from 'primeng/tabs';
import { CommonModule } from '@angular/common';
import { GeneralSettings } from './general-settings/general-settings';
import { MailSettingsComponent } from './mail-settings/mail-settings';
import { PublicPhrasesSettings } from './public-phrases-settings/public-phrases-settings';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { FormGroup, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-company-settings',
  imports: [
    CommonModule,
    FormsModule,
    TabsModule,
    TranslatePipe,
    GeneralSettings,
    MailSettingsComponent,
    PublicPhrasesSettings,
    ButtonModule,
  ],
  templateUrl: './company-settings.html',
  styleUrl: './company-settings.scss'
})
export class CompanySettingsComponent {
  private translate = inject(TranslateService);
  form!: FormGroup;

  constructor(
    public ref: DynamicDialogRef,
  ) { }

}
