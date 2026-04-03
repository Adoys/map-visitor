import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-unauthorized',
  imports: [TranslatePipe],
  templateUrl: './unauthorized.html',
  styleUrl: './unauthorized.scss'
})
export class UnauthorizedComponent {
  private translate = inject(TranslateService);
  
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}
