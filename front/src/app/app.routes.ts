import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { DashboardComponent } from './features/dashboard/dashboard';
import { UnauthorizedComponent } from './features/unauthorized/unauthorized';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'unauthorized', component: UnauthorizedComponent },
    { path: '', component: DashboardComponent },
    
    /*   
    {
        path: 'admin',
        component: AdminDashboardComponent,
        canActivate: [authGuard],
        data: { roles: ['admin'] },
    },
    {
        path: 'screen',
        component: ScreenViewComponent,
        canActivate: [authGuard],
        data: { roles: ['screen'] },
    },*/
    { path: '**', redirectTo: '' },
];
