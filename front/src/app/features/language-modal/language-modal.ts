import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LanguagesService } from './language.service';
import { LanguageFormModalComponent } from './language-form-modal.component';
import { Language } from './models/languages';
import { ToastModule } from "primeng/toast";


@Component({
  selector: 'app-language-modal',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [DialogService, ConfirmationService, MessageService],
  templateUrl: './language-modal.html',
  styleUrl: './language-modal.scss'
})
export class LanguageModal {
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
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  openCreateModal() {
    this.ref = this.dialogService.open(LanguageFormModalComponent, {
      header: 'Agregar idioma',
      width: 'auto',
      data: null
    });
    this.ref?.onClose.subscribe((changed) => { if (changed) this.loadLanguages(); });
  }

  openEditModal(lang: Language) {
    this.ref = this.dialogService.open(LanguageFormModalComponent, {
      header: 'Editar idioma',
      width: 'auto',
      data: lang
    });
    this.ref?.onClose.subscribe((changed) => { if (changed) this.loadLanguages(); });
  }

  confirmDelete(lang: Language) {
    this.confirmation.confirm({
      message: `¿Eliminar el idioma "${lang.name}"?`,
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.langService.delete(lang.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Idioma eliminado correctamente'
            });
            this.loadLanguages();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'Error al eliminar el idioma'
            });
          }
        });
      }
    });
  }
}