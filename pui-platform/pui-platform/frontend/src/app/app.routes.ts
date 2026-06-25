import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'verificar-curp',
    canActivate: [authGuard],
    loadComponent: () => import('./features/verificar-curp/verificar-curp.component').then(m => m.VerificarCurpComponent),
  },
  {
    path: 'reportes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reportes/reportes-list.component').then(m => m.ReportesListComponent),
  },
  {
    path: 'reportes/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reportes/reporte-detail.component').then(m => m.ReporteDetailComponent),
  },
  {
    path: 'coincidencias',
    canActivate: [authGuard],
    loadComponent: () => import('./features/coincidencias/coincidencias-list.component').then(m => m.CoincidenciasListComponent),
  },
  {
    path: 'logs',
    canActivate: [authGuard],
    loadComponent: () => import('./features/logs/logs-list.component').then(m => m.LogsListComponent),
  },
  { path: '**', redirectTo: '/dashboard' },
];
