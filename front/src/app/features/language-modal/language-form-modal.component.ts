import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { LanguagesService } from './language.service';
import { MessageService } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';


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
    TranslatePipe,
    FileUploadModule,
  ],
  providers: [],
  templateUrl: 'language-form-modal.component.html',
  styleUrl: 'language-form-modal.component.scss',
})
export class LanguageFormModalComponent implements OnInit {
  private translate = inject(TranslateService);

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
          summary: this.translate.instant('COMMON_LABELS.SUCCESS'),
          detail: this.translate.instant(this.config.data ? 'LANGUAGES.UPDATE_SUCCESS' : 'LANGUAGES.CREATE_SUCCESS')
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('COMMON_LABELS.ERROR'),
          detail: err.error?.message || this.translate.instant('LANGUAGES.SAVE_ERROR')
        });
      }
    });
  }

  onFlagSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionamos manteniendo el aspect ratio
        const maxSize = 512; // ancho o alto máximo
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else if (height > width && height > maxSize) {
          width = (width / height) * maxSize;
          height = maxSize;
        } else if (width > maxSize) {
          width = maxSize;
          height = maxSize;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);

        // Convertimos a base64 pero en formato comprimido JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        this.form.patchValue({ flag: compressedBase64 });
        this.previewFlag = compressedBase64;
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  }

}
