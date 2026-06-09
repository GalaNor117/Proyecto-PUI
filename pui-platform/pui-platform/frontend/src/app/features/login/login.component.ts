import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5">
      <mat-card style="width:380px;padding:32px">
        <mat-card-header>
          <mat-card-title style="font-size:1.5rem;margin-bottom:8px">PUI - Panel</mat-card-title>
          <mat-card-subtitle>Plataforma Única de Identidad</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content style="margin-top:24px">
          <mat-form-field appearance="outline" style="width:100%">
            <mat-label>Usuario</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <input matInput [(ngModel)]="username" placeholder="Usuario" required>
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:100%;margin-top:8px">
            <mat-label>Contraseña</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput [type]="showPass() ? 'text' : 'password'" [(ngModel)]="password" required>
            <button mat-icon-button matSuffix (click)="showPass.set(!showPass())">
              <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>
          <div *ngIf="error()" style="color:#f44336;margin:8px 0;font-size:0.85rem">{{ error() }}</div>
        </mat-card-content>
        <mat-card-actions style="padding:0 16px 16px">
          <button mat-raised-button color="primary" style="width:100%" (click)="login()" [disabled]="loading()">
            <mat-spinner *ngIf="loading()" diameter="20" style="display:inline-block;margin-right:8px"></mat-spinner>
            Iniciar sesión
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  login(): void {
    if (!this.username || !this.password) { this.error.set('Ingresa usuario y contraseña'); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => { this.error.set('Credenciales inválidas'); this.loading.set(false); },
    });
  }
}
