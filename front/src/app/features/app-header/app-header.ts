import { Component } from '@angular/core';
import { LanguageModal } from "../language-modal/language-modal";
import { AdminMenu } from "../admin-menu/admin-menu";
import { CompanySettingsService } from '../../shared/interfaces/company-settings.service';
import { LoginService } from '../login/login.service';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    ButtonModule,
    SplitButtonModule,
    DynamicDialogModule,
    MenuModule
  ],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  providers: [DialogService]
})
export class AppHeader {
  iconUrl = '/assets/icons/default.png';
  phoneNumber = '+34 600 000 000';
  currentFlag = '/assets/flags/es.png';

  languageModalOpen = false;
  adminMenuOpen = false;

  isAdmin = false;
  ref!: DynamicDialogRef | null;
  adminMenu: MenuItem[] = [
    { label: 'Usuarios', icon: 'pi pi-users', command: () => this.openUsersModal() },
    { label: 'Configuración', icon: 'pi pi-cog', command: () => this.openSettingsModal() },
    { label: 'Idiomas', icon: 'pi pi-globe', command: () => this.openLanguagesModal() },
    { separator: true },
    { label: 'Salir', icon: 'pi pi-sign-out', command: () => this.auth.logout() }
  ];

  constructor(
    public company: CompanySettingsService,
    public auth: LoginService,
    public dialogService: DialogService
  ) {
    this.isAdmin = this.auth.isAdmin();
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }

  openLanguageModal() {
    this.languageModalOpen = true;
  }

  toggleAdminMenu() {
    this.adminMenuOpen = !this.adminMenuOpen;
  }

  openUsersModal() {
    //  this.ref = this.dialogService.open(UsersModalComponent, {
    //    header: 'Gestión de Usuarios',
    //    width: '70vw',
    //    modal: true,
    //    closable: true,
    //  });
  }

  openSettingsModal() {
    //  this.ref = this.dialogService.open(CompanySettingsModalComponent, {
    //    header: 'Configuración de la Empresa',
    //    width: '60vw',
    //    modal: true,
    //    closable: true,
    //  });
  }

  openLanguagesModal() {
    this.ref = this.dialogService.open(LanguageModal, {
      header: 'Gestión de Idiomas',
      width: '60vw',
      modal: true,
      closable: true,
    });
  }
}
