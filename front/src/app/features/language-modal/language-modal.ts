import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LanguagesService } from './language.service';
import { LanguageFormModalComponent } from './language-form-modal.component';
import { Language } from './models/languages';
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
  templateUrl: './language-modal.html',
  styleUrl: './language-modal.scss'
})
export class LanguageModal {
  private translate = inject(TranslateService);

  languages: Language[] = [];
  loading = false;
  ref?: DynamicDialogRef | null;

  constructor(
    private langService: LanguagesService,
    private dialogService: DialogService,
    private confirmation: ConfirmationService,
    private messageService: MessageService,
  ) { }

  ngOnInit() {
    this.loadLanguages();
  }

  loadLanguages() {
    this.loading = true;
    this.langService.findAll().subscribe({
      next: (data) => { this.languages = data; this.loading = false; },
      error: (err) => { this.loading = false; }
    });
  }

  openCreateModal() {
    this.ref = this.dialogService.open(LanguageFormModalComponent, {
      header: this.translate.instant('LANGUAGES.ADD'),
      width: 'auto',
      data: null
    });
    this.ref?.onClose.subscribe((changed) => { if (changed) this.loadLanguages(); });
  }

  openEditModal(lang: Language) {
    this.ref = this.dialogService.open(LanguageFormModalComponent, {
      header: this.translate.instant('LANGUAGES.EDIT'),
      width: 'auto',
      data: lang
    });
    this.ref?.onClose.subscribe((changed) => { if (changed) this.loadLanguages(); });
  }

  confirmDelete(lang: Language) {
    this.confirmation.confirm({
      message: this.translate.instant('LANGUAGES.CONFIRM_DELETE', { name: lang.name}),
      acceptLabel: this.translate.instant('COMMON_LABELS.YES'),
      rejectLabel: this.translate.instant('COMMON_LABELS.NO'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.langService.delete(lang.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translate.instant('COMMON_LABELS.SUCCESS'),
              detail: this.translate.instant('COMMON_LABELS.DELETE_SUCCESS')
            });
            this.loadLanguages();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: this.translate.instant('COMMON_LABELS.ERROR'),
              detail: err.error?.message || this.translate.instant('LANGUAGES.DELETE_ERROR')
            });
          }
        });
      }
    });
  }
}