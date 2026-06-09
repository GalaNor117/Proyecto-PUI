import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { PanelApiService, DashboardData } from '../../core/services/panel-api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatToolbarModule, MatProgressSpinnerModule, MatSidenavModule, MatListModule,
  ],
  template: `
    <mat-sidenav-container style="height:100vh">
      <mat-sidenav mode="side" opened style="width:220px">
        <mat-toolbar color="primary" style="font-size:1rem">PUI Panel</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard"><mat-icon>dashboard</mat-icon> Dashboard</a>
          <a mat-list-item routerLink="/verificar-curp"><mat-icon>fact_check</mat-icon> Verificar CURP</a>
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
        <h1 style="margin:0 0 24px">Dashboard</h1>
        <div *ngIf="loading()" style="display:flex;justify-content:center;padding:40px">
          <mat-spinner></mat-spinner>
        </div>
        <div *ngIf="data()" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px">
          <mat-card class="metrics-card">
            <mat-card-content>
              <div style="display:flex;align-items:center;gap:12px">
                <mat-icon style="font-size:40px;color:#1976d2">person_search</mat-icon>
                <div><div style="font-size:2rem;font-weight:700">{{ data()!.reportes.activos }}</div><div style="color:#666">Reportes activos</div></div>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="metrics-card">
            <mat-card-content>
              <div style="display:flex;align-items:center;gap:12px">
                <mat-icon style="font-size:40px;color:#7b1fa2">folder</mat-icon>
                <div><div style="font-size:2rem;font-weight:700">{{ data()!.reportes.total }}</div><div style="color:#666">Total reportes</div></div>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="metrics-card">
            <mat-card-content>
              <div style="display:flex;align-items:center;gap:12px">
                <mat-icon style="font-size:40px;color:#388e3c">check_circle</mat-icon>
                <div><div style="font-size:2rem;font-weight:700">{{ data()!.coincidencias.total }}</div><div style="color:#666">Coincidencias enviadas</div></div>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card class="metrics-card">
            <mat-card-content>
              <div style="display:flex;align-items:center;gap:12px">
                <mat-icon style="font-size:40px" [class]="data()!.sistema.estado_conexion_pui === 'ok' ? 'pui-status-ok' : 'pui-status-error'">
                  {{ data()!.sistema.estado_conexion_pui === 'ok' ? 'wifi' : 'wifi_off' }}
                </mat-icon>
                <div>
                  <div style="font-size:1rem;font-weight:700" [class]="data()!.sistema.estado_conexion_pui === 'ok' ? 'pui-status-ok' : 'pui-status-error'">
                    {{ data()!.sistema.estado_conexion_pui === 'ok' ? 'Conectado' : 'Error' }}
                  </div>
                  <div style="color:#666;font-size:0.8rem">Estado PUI</div>
                  <div style="color:#999;font-size:0.75rem">{{ data()!.sistema.ultima_sincronizacion | date:'short' }}</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
        <div *ngIf="data()" style="margin-top:24px">
          <mat-card>
            <mat-card-header><mat-card-title>Coincidencias por fase</mat-card-title></mat-card-header>
            <mat-card-content style="padding:16px;display:flex;gap:24px">
              <div><span class="phase-badge f1">F1</span> {{ data()!.coincidencias.por_fase.fase1 }}</div>
              <div><span class="phase-badge f2">F2</span> {{ data()!.coincidencias.por_fase.fase2 }}</div>
              <div><span class="phase-badge f3">F3</span> {{ data()!.coincidencias.por_fase.fase3 }}</div>
              <div style="margin-left:auto;color:#666">Este mes: <strong>{{ data()!.coincidencias.este_mes }}</strong></div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class DashboardComponent implements OnInit {
  data = signal<DashboardData | null>(null);
  loading = signal(true);

  constructor(private api: PanelApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.api.getDashboard().subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  logout(): void { this.auth.logout(); }
}
