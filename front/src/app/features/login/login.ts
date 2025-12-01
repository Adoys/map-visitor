import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { LoginService } from './login.service';

@Component({
  selector: 'app-login',
  imports: [CardModule, InputTextModule, PasswordModule, ButtonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(private auth: LoginService) { }

  login() {
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.auth.sendToMap(),
      error: (err) => alert('Error de login: ' + err.error.message),
    });
  }

  return() {
    this.auth.sendToMap();
  }
}
