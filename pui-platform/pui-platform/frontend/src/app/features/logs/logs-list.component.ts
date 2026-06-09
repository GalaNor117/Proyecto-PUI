import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { PanelApiService, Log } from '../../core/services/panel-api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-logs-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatToolbarModule,
    MatProgressSpinnerModule, MatSidenavModule, MatListModule, MatCardModule, MatChipsModule,
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
          <a mat-list-item routerLink="/logs" style="background:#e3f2fd"><mat-icon>list_alt</mat-icon> Logs</a>
        </mat-nav-list>
        <div style="position:absolute;bottom:16px;left:0;right:0;padding:0 8px">
          <button mat-stroked-button style="width:100%" (click)="logout()">
            <mat-icon>logout</mat-icon> Salir
          </button>
        </div>
      </mat-sidenav>
      <mat-sidenav-content style="padding:24px">
        <h1 style="margin:0 0 16px">Bitácora de actividad</h1>
        <mat-card style="margin-bottom:16px;padding:16px">
          <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
            <mat-form-field appearance="outline" style="width:220px">
              <mat-label>Tipo</mat-label>
              <mat-select [(ngModel)]="filtroTipo" (selectionChange)="buscar()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="RECIBIDO_ACTIVAR">RECIBIDO_ACTIVAR</mat-option>
                <mat-option value="RECIBIDO_DESACTIVAR">RECIBIDO_DESACTIVAR</mat-option>
                <mat-option value="ENVIADO_COINCIDENCIA">ENVIADO_COINCIDENCIA</mat-option>
                <mat-option value="ENVIADO_FINALIZADA">ENVIADO_FINALIZADA</mat-option>
                <mat-option value="ERROR_PUI">ERROR_PUI</mat-option>
                <mat-option value="ERROR_WEBHOOK">ERROR_WEBHOOK</mat-option>
                <mat-option value="SCHEDULER_INICIO">SCHEDULER_INICIO</mat-option>
                <mat-option value="SCHEDULER_FIN">SCHEDULER_FIN</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:160px">
              <mat-label>Desde</mat-label>
              <input matInput type="date" [(ngModel)]="filtroDesde" (change)="buscar()">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:160px">
              <mat-label>Hasta</mat-label>
              <input matInput type="date" [(ngModel)]="filtroHasta" (change)="buscar()">
            </mat-form-field>
          </div>
        </mat-card>
        <div *ngIf="loading()" style="display:flex;justify-content:center;padding:40px"><mat-spinner></mat-spinner></div>
        <mat-card *ngIf="!loading()">
          <table mat-table [dataSource]="logs()" style="width:100%">
            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef>Timestamp</th>
              <td mat-cell *matCellDef="let l" style="font-size:0.8rem">{{ l.timestamp | date:'dd/MM/yy HH:mm:ss' }}</td>
            </ng-container>
            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let l">
                <mat-chip [color]="l.tipo.startsWith('ERROR') ? 'warn' : 'primary'" highlighted style="font-size:0.7rem">
                  {{ l.tipo }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="reporte_id">
              <th mat-header-cell *matHeaderCellDef>Reporte</th>
              <td mat-cell *matCellDef="let l" style="font-size:0.8rem">
                <code *ngIf="l.reporte_id">{{ l.reporte_id | slice:0:16 }}...</code>
              </td>
            </ng-container>
            <ng-container matColumnDef="curp_hash">
              <th mat-header-cell *matHeaderCellDef>CURP</th>
              <td mat-cell *matCellDef="let l">
                <code *ngIf="l.curp_hash" style="font-size:0.8rem">
                  ••••••••••••{{ l.curp_hash | slice:0:4 }}
                </code>
              </td>
            </ng-container>
            <ng-container matColumnDef="endpoint">
              <th mat-header-cell *matHeaderCellDef>Endpoint</th>
              <td mat-cell *matCellDef="let l" style="font-size:0.8rem">{{ l.endpoint }}</td>
            </ng-container>
            <ng-container matColumnDef="http_status">
              <th mat-header-cell *matHeaderCellDef>HTTP</th>
              <td mat-cell *matCellDef="let l">
                <span [style.color]="l.http_status === 200 ? '#388e3c' : '#f44336'">{{ l.http_status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="error_mensaje">
              <th mat-header-cell *matHeaderCellDef>Error</th>
              <td mat-cell *matCellDef="let l" style="font-size:0.75rem;color:#f44336;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                {{ l.error_mensaje }}
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>
          <mat-paginator [length]="total()" [pageSize]="50" [pageSizeOptions]="[20,50,100]"
            (page)="onPage($event)" showFirstLastButtons></mat-paginator>
        </mat-card>
        <p style="margin-top:16px;color:#9e9e9e;font-size:0.8rem">
          * El CURP se muestra enmascarado (SHA-256). Nunca se almacena en claro.
        </p>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class LogsListComponent implements OnInit {
  cols = ['timestamp', 'tipo', 'reporte_id', 'curp_hash', 'endpoint', 'http_status', 'error_mensaje'];
  logs = signal<Log[]>([]);
  total = signal(0);
  loading = signal(true);
  filtroTipo = '';
  filtroDesde = '';
  filtroHasta = '';
  pagina = 1;

  constructor(private api: PanelApiService, private auth: AuthService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.api.getLogs({
      pagina: this.pagina, limite: 50,
      tipo: this.filtroTipo || undefined,
      desde: this.filtroDesde || undefined,
      hasta: this.filtroHasta || undefined,
    }).subscribe({
      next: r => { this.logs.set(r.datos); this.total.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  buscar(): void { this.pagina = 1; this.cargar(); }
  onPage(e: PageEvent): void { this.pagina = e.pageIndex + 1; this.cargar(); }
  logout(): void { this.auth.logout(); }
}
