import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { LanguagesService } from './language.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';


@Component({
  standalone: true,
  selector: 'app-language-form-modal',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    ToastModule,
  ],
  templateUrl: 'language-form-modal.component.html',
  styleUrl: 'language-form-modal.component.scss',
})
export class LanguageFormModalComponent implements OnInit {

  form!: FormGroup;
  previewFlag: string | null = null;

  constructor(
    private fb: FormBuilder,
    private langService: LanguagesService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private messageService: MessageService,
  ) { }

  ngOnInit() {
    const lang = this.config.data;
    this.form = this.fb.group({
      code: [lang?.code || '', Validators.required],
      name: [lang?.name || '', Validators.required],
      flag: [lang?.flag || ''],
      isDefault: [lang?.isDefault || false],
    });
    this.previewFlag = lang?.flag || null;
  }

  submit() {
    const payload = this.form.value;

    const request$ = this.config.data
      ? this.langService.update(this.config.data.id, payload)
      : this.langService.create(payload);

    request$.subscribe({
      next: () => {
        this.ref.close(true);
        this.messageService.add({
          severity: 'success',
          summary: 'Correcto',
          detail: 'Idioma guardado correctamente'
        });
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al guardar el idioma'
        });
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.form.patchValue({ flag: base64 });
        this.previewFlag = base64;
      };
      reader.readAsDataURL(file);
    }
  }

  onFlagSelected(base64: Event) {
    console.log(base64);
  }
}
