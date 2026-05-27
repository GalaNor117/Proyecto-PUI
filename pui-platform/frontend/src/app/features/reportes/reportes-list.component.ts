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
import { PanelApiService, Reporte } from '../../core/services/panel-api.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-reportes-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatToolbarModule,
    MatProgressSpinnerModule, MatSidenavModule, MatListModule, MatCardModule,
    StatusBadgeComponent,
  ],
  template: `
    <mat-sidenav-container style="height:100vh">
      <mat-sidenav mode="side" opened style="width:220px">
        <mat-toolbar color="primary" style="font-size:1rem">PUI Panel</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard"><mat-icon>dashboard</mat-icon> Dashboard</a>
          <a mat-list-item routerLink="/verificar-curp"><mat-icon>fact_check</mat-icon> Verificar CURP</a>
          <a mat-list-item routerLink="/reportes" style="background:#e3f2fd"><mat-icon>assignment</mat-icon> Reportes</a>
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
        <h1 style="margin:0 0 16px">Reportes</h1>
        <mat-card style="margin-bottom:16px;padding:16px">
          <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
            <mat-form-field appearance="outline" style="width:220px">
              <mat-label>Buscar CURP o nombre</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [(ngModel)]="filtro" (input)="buscar()">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:160px">
              <mat-label>Estado</mat-label>
              <mat-select [(ngModel)]="filtroActivo" (selectionChange)="buscar()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="true">Activos</mat-option>
                <mat-option value="false">Inactivos</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card>
        <div *ngIf="loading()" style="display:flex;justify-content:center;padding:40px"><mat-spinner></mat-spinner></div>
        <mat-card *ngIf="!loading()">
          <table mat-table [dataSource]="reportes()" style="width:100%">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let r">{{ r.id | slice:0:20 }}...</td>
            </ng-container>
            <ng-container matColumnDef="curp">
              <th mat-header-cell *matHeaderCellDef>CURP</th>
              <td mat-cell *matCellDef="let r"><code>{{ r.curp }}</code></td>
            </ng-container>
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let r">{{ r.nombre }} {{ r.primer_apellido }}</td>
            </ng-container>
            <ng-container matColumnDef="fecha_desaparicion">
              <th mat-header-cell *matHeaderCellDef>Desaparición</th>
              <td mat-cell *matCellDef="let r">{{ r.fecha_desaparicion | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="activo">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let r"><app-status-badge [active]="r.activo"></app-status-badge></td>
            </ng-container>
            <ng-container matColumnDef="fases">
              <th mat-header-cell *matHeaderCellDef>Fases</th>
              <td mat-cell *matCellDef="let r">
                <span class="phase-badge f1">F1 {{ r.fase1_completada ? '✓' : '…' }}</span>
                <span class="phase-badge f2">F2 {{ r.fase2_completada ? '✓' : '…' }}</span>
                <span class="phase-badge f3">F3 {{ r.activo ? '↻' : '-' }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <button mat-icon-button [routerLink]="['/reportes', r.id]">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;" style="cursor:pointer" [routerLink]="['/reportes', row.id]"></tr>
          </table>
          <mat-paginator [length]="total()" [pageSize]="20" [pageSizeOptions]="[10,20,50]"
            (page)="onPage($event)" showFirstLastButtons></mat-paginator>
        </mat-card>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class ReportesListComponent implements OnInit {
  cols = ['id', 'curp', 'nombre', 'fecha_desaparicion', 'activo', 'fases', 'acciones'];
  reportes = signal<Reporte[]>([]);
  total = signal(0);
  loading = signal(true);
  filtro = '';
  filtroActivo = '';
  pagina = 1;

  constructor(private api: PanelApiService, private auth: AuthService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.api.getReportes({ pagina: this.pagina, limite: 20, busqueda: this.filtro || undefined, activo: this.filtroActivo || undefined }).subscribe({
      next: r => { this.reportes.set(r.datos); this.total.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  buscar(): void { this.pagina = 1; this.cargar(); }

  onPage(e: PageEvent): void { this.pagina = e.pageIndex + 1; this.cargar(); }

  logout(): void { this.auth.logout(); }
}
