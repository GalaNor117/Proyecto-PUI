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
import { PanelApiService, Coincidencia } from '../../core/services/panel-api.service';
import { FaseLabelPipe } from '../../shared/pipes/fase-label.pipe';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-coincidencias-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatToolbarModule,
    MatProgressSpinnerModule, MatSidenavModule, MatListModule, MatCardModule,
    FaseLabelPipe,
  ],
  template: `
    <mat-sidenav-container style="height:100vh">
      <mat-sidenav mode="side" opened style="width:220px">
        <mat-toolbar color="primary" style="font-size:1rem">PUI Panel</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard"><mat-icon>dashboard</mat-icon> Dashboard</a>
          <a mat-list-item routerLink="/verificar-curp"><mat-icon>fact_check</mat-icon> Verificar CURP</a>
          <a mat-list-item routerLink="/reportes"><mat-icon>assignment</mat-icon> Reportes</a>
          <a mat-list-item routerLink="/coincidencias" style="background:#e3f2fd"><mat-icon>find_in_page</mat-icon> Coincidencias</a>
          <a mat-list-item routerLink="/logs"><mat-icon>list_alt</mat-icon> Logs</a>
        </mat-nav-list>
        <div style="position:absolute;bottom:16px;left:0;right:0;padding:0 8px">
          <button mat-stroked-button style="width:100%" (click)="logout()">
            <mat-icon>logout</mat-icon> Salir
          </button>
        </div>
      </mat-sidenav>
      <mat-sidenav-content style="padding:24px">
        <h1 style="margin:0 0 16px">Coincidencias enviadas a la PUI</h1>
        <mat-card style="margin-bottom:16px;padding:16px">
          <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
            <mat-form-field appearance="outline" style="width:220px">
              <mat-label>Reporte ID</mat-label>
              <input matInput [(ngModel)]="filtroReporte" (input)="buscar()">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:140px">
              <mat-label>Fase</mat-label>
              <mat-select [(ngModel)]="filtroFase" (selectionChange)="buscar()">
                <mat-option value="">Todas</mat-option>
                <mat-option value="1">Fase 1</mat-option>
                <mat-option value="2">Fase 2</mat-option>
                <mat-option value="3">Fase 3</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:160px">
              <mat-label>Desde</mat-label>
              <input matInput type="date" [(ngModel)]="filtroDesde" (change)="buscar()">
            </mat-form-field>
          </div>
        </mat-card>
        <div *ngIf="loading()" style="display:flex;justify-content:center;padding:40px"><mat-spinner></mat-spinner></div>
        <mat-card *ngIf="!loading()">
          <table mat-table [dataSource]="coincidencias()" style="width:100%">
            <ng-container matColumnDef="reporte_id">
              <th mat-header-cell *matHeaderCellDef>Reporte ID</th>
              <td mat-cell *matCellDef="let c"><code>{{ c.reporte_id | slice:0:20 }}...</code></td>
            </ng-container>
            <ng-container matColumnDef="fase_busqueda">
              <th mat-header-cell *matHeaderCellDef>Fase</th>
              <td mat-cell *matCellDef="let c">
                <span [class]="'phase-badge f' + c.fase_busqueda">{{ c.fase_busqueda | faseLabel }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="tipo_evento">
              <th mat-header-cell *matHeaderCellDef>Tipo evento</th>
              <td mat-cell *matCellDef="let c">{{ c.tipo_evento || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="fecha_evento">
              <th mat-header-cell *matHeaderCellDef>Fecha evento</th>
              <td mat-cell *matCellDef="let c">{{ c.fecha_evento | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="enviado_en">
              <th mat-header-cell *matHeaderCellDef>Fecha envío</th>
              <td mat-cell *matCellDef="let c">{{ c.enviado_en | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="http_status">
              <th mat-header-cell *matHeaderCellDef>HTTP</th>
              <td mat-cell *matCellDef="let c">
                <span [style.color]="c.http_status === 200 ? '#388e3c' : '#f44336'">{{ c.http_status }}</span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>
          <mat-paginator [length]="total()" [pageSize]="20" [pageSizeOptions]="[10,20,50]"
            (page)="onPage($event)" showFirstLastButtons></mat-paginator>
        </mat-card>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class CoincidenciasListComponent implements OnInit {
  cols = ['reporte_id', 'fase_busqueda', 'tipo_evento', 'fecha_evento', 'enviado_en', 'http_status'];
  coincidencias = signal<Coincidencia[]>([]);
  total = signal(0);
  loading = signal(true);
  filtroReporte = '';
  filtroFase = '';
  filtroDesde = '';
  pagina = 1;

  constructor(private api: PanelApiService, private auth: AuthService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.api.getCoincidencias({
      pagina: this.pagina, limite: 20,
      reporte_id: this.filtroReporte || undefined,
      fase: this.filtroFase || undefined,
      desde: this.filtroDesde || undefined,
    }).subscribe({
      next: r => { this.coincidencias.set(r.datos); this.total.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  buscar(): void { this.pagina = 1; this.cargar(); }
  onPage(e: PageEvent): void { this.pagina = e.pageIndex + 1; this.cargar(); }
  logout(): void { this.auth.logout(); }
}
