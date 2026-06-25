import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { PanelApiService, VerificacionCurp } from '../../core/services/panel-api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-verificar-curp',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatToolbarModule, MatProgressSpinnerModule, MatSidenavModule,
    MatListModule, MatCardModule,
  ],
  template: `
    <mat-sidenav-container style="height:100vh">
      <mat-sidenav mode="side" opened style="width:220px">
        <mat-toolbar color="primary" style="font-size:1rem">PUI Panel</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard"><mat-icon>dashboard</mat-icon> Dashboard</a>
          <a mat-list-item routerLink="/verificar-curp" style="background:#e3f2fd"><mat-icon>fact_check</mat-icon> Verificar CURP</a>
          <a mat-list-item routerLink="/reportes"><mat-icon>assignment</mat-icon> Reportes</a>
          <a mat-list-item routerLink="/coincidencias"><mat-icon>find_in_page</mat-icon> Coincidencias</a>
          <a mat-list-item routerLink="/logs"><mat-icon>list_alt</mat-icon> Logs</a>
        </mat-nav-list>
        <div style="position:absolute;bottom:16px;left:0;right:0;padding:0 8px">
          <button mat-stroked-button style="width:100%" (click)="logout()">
            <mat-icon>logout</mat-icon> Salir
          </button>
        </div>
      </mat-sidenav>
      <mat-sidenav-content style="padding:24px">
        <h1 style="margin:0 0 8px">Verificar CURP</h1>
        <p style="margin:0 0 16px;color:#666">
          Comprueba si una CURP corresponde a una persona con reporte activo en la PUI.
        </p>

        <mat-card style="padding:16px;max-width:600px">
          <form (ngSubmit)="verificar()" #f="ngForm">
            <mat-form-field appearance="outline" style="width:100%">
              <mat-label>CURP del solicitante</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input matInput
                     [(ngModel)]="curp"
                     name="curp"
                     maxlength="18"
                     placeholder="AAAA000000HDFAAA00"
                     (input)="onInput()"
                     required>
              <mat-hint align="end">{{ curp.length }}/18</mat-hint>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit"
                    [disabled]="loading() || curp.length !== 18"
                    style="margin-top:8px">
              <mat-icon>search</mat-icon> Verificar
            </button>
          </form>
        </mat-card>

        <div *ngIf="loading()" style="display:flex;justify-content:center;padding:40px">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <mat-card *ngIf="error()" style="margin-top:16px;padding:16px;max-width:600px;background:#fff3e0">
          <div style="display:flex;align-items:center;gap:8px;color:#e65100">
            <mat-icon>warning</mat-icon>
            <span>{{ error() }}</span>
          </div>
        </mat-card>

        <ng-container *ngIf="resultado() as r">
          <mat-card *ngIf="!r.extraviada"
                    style="margin-top:16px;padding:16px;max-width:600px;background:#e8f5e9;border-left:4px solid #2e7d32">
            <div style="display:flex;align-items:center;gap:12px">
              <mat-icon style="color:#2e7d32;font-size:32px;width:32px;height:32px">check_circle</mat-icon>
              <div>
                <div style="font-weight:600;color:#1b5e20">Sin reporte activo</div>
                <div style="color:#555">
                  La CURP <code>{{ r.curp }}</code> no corresponde a ninguna persona con reporte activo.
                </div>
              </div>
            </div>
          </mat-card>

          <mat-card *ngIf="r.extraviada"
                    style="margin-top:16px;padding:16px;max-width:600px;background:#ffebee;border-left:4px solid #c62828">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <mat-icon style="color:#c62828;font-size:32px;width:32px;height:32px">error</mat-icon>
              <div>
                <div style="font-weight:600;color:#b71c1c">⚠ Persona con reporte activo</div>
                <div style="color:#555">
                  La CURP <code>{{ r.curp }}</code> está registrada como persona extraviada.
                </div>
              </div>
            </div>
            <div *ngIf="r.reporte as rep" style="margin-top:8px;padding-top:12px;border-top:1px solid #ffcdd2">
              <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:0.92rem">
                <strong>Reporte ID:</strong><span><code>{{ rep.id }}</code></span>
                <strong>Nombre:</strong>
                <span>{{ rep.nombre }} {{ rep.primer_apellido }} {{ rep.segundo_apellido }}</span>
                <strong>Fecha de desaparición:</strong>
                <span>{{ rep.fecha_desaparicion ? (rep.fecha_desaparicion | date:'dd/MM/yyyy') : '—' }}</span>
                <strong>Fecha de activación:</strong>
                <span>{{ rep.fecha_activacion | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <a mat-stroked-button color="primary"
                 [routerLink]="['/reportes', rep.id]"
                 style="margin-top:12px">
                <mat-icon>open_in_new</mat-icon> Ver detalle del reporte
              </a>
            </div>
          </mat-card>

          <div style="margin-top:8px;color:#999;font-size:0.85rem;max-width:600px">
            Verificado: {{ r.verificado_en | date:'dd/MM/yyyy HH:mm:ss' }}
          </div>
        </ng-container>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class VerificarCurpComponent {
  curp = '';
  loading = signal(false);
  resultado = signal<VerificacionCurp | null>(null);
  error = signal<string | null>(null);

  constructor(private api: PanelApiService, private auth: AuthService) {}

  onInput(): void {
    this.curp = this.curp.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);
    if (this.resultado() || this.error()) {
      this.resultado.set(null);
      this.error.set(null);
    }
  }

  verificar(): void {
    if (this.curp.length !== 18) return;
    this.loading.set(true);
    this.resultado.set(null);
    this.error.set(null);
    this.api.verificarCurp(this.curp).subscribe({
      next: r => {
        this.resultado.set(r);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = err.error?.message ?? 'No se pudo verificar la CURP. Intenta de nuevo.';
        this.error.set(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
        this.loading.set(false);
      },
    });
  }

  logout(): void { this.auth.logout(); }
}
