import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { LanguageModal } from "../language-modal/language-modal";
import { GeneralSettingsService } from '../company-settings/general-settings/general-settings.service';
import { LoginService } from '../login/login.service';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { UserModalComponent } from '../user-modal/components/list/user-modal';
import { LanguagesService } from '../language-modal/language.service';
import { SelectModule } from 'primeng/select';
import { LangChangeEvent, TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CompanySettingsComponent } from '../company-settings/company-settings';
import { AppTranslationsService } from '../app-translations/app-translations.service';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    ButtonModule,
    SplitButtonModule,
    DynamicDialogModule,
    MenuModule,
    SelectModule,
    FormsModule,
    TranslateModule,
    TranslatePipe,
  ],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  providers: []
})
export class AppHeader implements OnInit, OnDestroy {
  private translate = inject(TranslateService);
  NO_FLAG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAGAQMAAADAFZkaAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAABFJREFUCNdjYBgFo2AUjIJRMAwAAAkABpK/JMZIAAAAASUVORK5CYII=';
  phoneNumber = '+34 600 000 000';
  currentFlag = '/assets/flags/es.png';

  adminMenuOpen = false;
  languages: any[] = [];
  selectedLanguage: string = '';

  isAdmin = false;
  ref!: DynamicDialogRef | null;
  adminMenu: MenuItem[] = [];

  constructor(
    public company: GeneralSettingsService,
    public auth: LoginService,
    public dialogService: DialogService,
    private langService: LanguagesService,
    private appTranslations: AppTranslationsService,
  ) {
    this.isAdmin = this.auth.isAdmin();
  }

  ngOnInit(): void {
    this.langService.findAll().subscribe(langs => {
      this.languages = langs;

      const savedLang = localStorage.getItem('lang');
      this.selectedLanguage = savedLang || this.translate.getBrowserLang() || langs[0]?.code || 'es';

      this.useLanguage(this.selectedLanguage);

      // construir menú la primera vez
      this.buildAdminMenuReactive();

      // actualizar menú cada vez que cambie el idioma
      this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
        this.buildAdminMenuReactive();
      });
    });
  }

  // Función que construye el menú con traducciones actuales
  buildAdminMenuReactive() {
    this.translate.get([
      'HEADER.ADMIN_MENU.USERS',
      'HEADER.ADMIN_MENU.SETTINGS',
      'HEADER.ADMIN_MENU.LANGUAGES',
      'HEADER.ADMIN_MENU.LOGOUT'
    ]).subscribe(translations => {
      this.adminMenu = [
        { label: translations['HEADER.ADMIN_MENU.USERS'], icon: 'pi pi-users', command: () => this.openUsersModal() },
        { label: translations['HEADER.ADMIN_MENU.SETTINGS'], icon: 'pi pi-cog', command: () => this.openSettingsModal() },
        { label: translations['HEADER.ADMIN_MENU.LANGUAGES'], icon: 'pi pi-globe', command: () => this.openLanguagesModal() },
        { separator: true },
        { label: translations['HEADER.ADMIN_MENU.LOGOUT'], icon: 'pi pi-sign-out', command: () => this.auth.logout() }
      ];
    });
  }

  getTranslateService() {
    return this.translate;
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }

  languageChange() {
    this.useLanguage(this.selectedLanguage);
    localStorage.setItem('lang', this.selectedLanguage);
  }

  private async useLanguage(languageCode: string): Promise<void> {
    if (!['es', 'en'].includes(languageCode)) {
      await this.appTranslations.applyLanguage(languageCode).catch(console.error);
      this.translate.use(languageCode);
      return;
    }

    this.translate.use(languageCode).subscribe(() => {
      this.appTranslations.applyLanguage(languageCode).catch(console.error);
    });
  }

  toggleAdminMenu() {
    this.adminMenuOpen = !this.adminMenuOpen;
  }

  openUsersModal() {
    this.ref = this.dialogService.open(UserModalComponent, {
      header: this.translate.instant('USERS.TITLE'),
      width: '70vw',
      modal: true,
      closable: true,
    });
  }

  openSettingsModal() {
    this.ref = this.dialogService.open(CompanySettingsComponent, {
      header: this.translate.instant('SETTINGS.TITLE'),
      width: 'auto',
      modal: true,
      closable: true,
    });
  }

  openLanguagesModal() {
    this.ref = this.dialogService.open(LanguageModal, {
      header: this.translate.instant('LANGUAGES.TITLE'),
      width: '60vw',
      modal: true,
      closable: true,
    });
  }
}
