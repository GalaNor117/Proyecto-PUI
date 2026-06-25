import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PanelApiService, Reporte, Coincidencia } from '../../core/services/panel-api.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { FaseLabelPipe } from '../../shared/pipes/fase-label.pipe';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-reporte-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule, MatChipsModule, MatSidenavModule,
    MatListModule, MatToolbarModule, StatusBadgeComponent, FaseLabelPipe,
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
      </mat-sidenav>
      <mat-sidenav-content style="padding:24px">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <button mat-icon-button routerLink="/reportes"><mat-icon>arrow_back</mat-icon></button>
          <h1 style="margin:0">Detalle del reporte</h1>
        </div>
        <div *ngIf="loading()" style="display:flex;justify-content:center;padding:40px"><mat-spinner></mat-spinner></div>
        <div *ngIf="reporte()" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Datos del reporte</mat-card-title>
              <mat-card-subtitle>{{ reporte()!.id }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content style="padding:16px">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div><strong>CURP:</strong><br><code>{{ reporte()!.curp }}</code></div>
                <div><div style="display:flex;align-items:center;gap:8px"><strong>Estado:</strong><app-status-badge [active]="reporte()!.activo"></app-status-badge></div></div>
                <div><strong>Nombre:</strong><br>{{ reporte()!.nombre }} {{ reporte()!.primer_apellido }} {{ reporte()!.segundo_apellido }}</div>
                <div><strong>Lugar nacimiento:</strong><br>{{ reporte()!.lugar_nacimiento }}</div>
                <div><strong>Fecha nacimiento:</strong><br>{{ reporte()!.fecha_nacimiento | date:'dd/MM/yyyy' }}</div>
                <div><strong>Fecha desaparición:</strong><br>{{ reporte()!.fecha_desaparicion | date:'dd/MM/yyyy' }}</div>
                <div><strong>Teléfono:</strong><br>{{ reporte()!.telefono || '-' }}</div>
                <div><strong>Correo:</strong><br>{{ reporte()!.correo || '-' }}</div>
              </div>
              <mat-divider style="margin:16px 0"></mat-divider>
              <div style="display:flex;gap:8px">
                <span class="phase-badge f1">F1 {{ reporte()!.fase1_completada ? '✓' : 'pendiente' }}</span>
                <span class="phase-badge f2">F2 {{ reporte()!.fase2_completada ? '✓' : 'pendiente' }}</span>
                <span class="phase-badge f3">F3 {{ reporte()!.activo ? 'activa' : 'detenida' }}</span>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card>
            <mat-card-header><mat-card-title>Cronología</mat-card-title></mat-card-header>
            <mat-card-content style="padding:16px">
              <div style="position:relative;padding-left:24px">
                <div style="position:absolute;left:8px;top:0;bottom:0;width:2px;background:#e0e0e0"></div>
                <div class="timeline-event">
                  <mat-icon style="color:#1976d2;font-size:16px">radio_button_checked</mat-icon>
                  <div><strong>Reporte activado</strong><br><small>{{ reporte()!.fecha_activacion | date:'dd/MM/yyyy HH:mm' }}</small></div>
                </div>
                <div *ngIf="reporte()!.fase1_completada" class="timeline-event">
                  <mat-icon style="color:#388e3c;font-size:16px">check_circle</mat-icon>
                  <div><strong>Fase 1 completada</strong></div>
                </div>
                <div *ngIf="reporte()!.fase2_completada" class="timeline-event">
                  <mat-icon style="color:#7b1fa2;font-size:16px">check_circle</mat-icon>
                  <div><strong>Fase 2 completada</strong></div>
                </div>
                <div *ngIf="reporte()!.fecha_desactivacion" class="timeline-event">
                  <mat-icon style="color:#f44336;font-size:16px">cancel</mat-icon>
                  <div><strong>Reporte desactivado</strong><br><small>{{ reporte()!.fecha_desactivacion | date:'dd/MM/yyyy HH:mm' }}</small></div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          <mat-card style="grid-column:1/-1">
            <mat-card-header><mat-card-title>Coincidencias enviadas ({{ coincidencias().length }})</mat-card-title></mat-card-header>
            <mat-card-content style="padding:16px">
              <table style="width:100%;border-collapse:collapse">
                <thead><tr style="text-align:left">
                  <th style="padding:8px;border-bottom:1px solid #e0e0e0">Fase</th>
                  <th style="padding:8px;border-bottom:1px solid #e0e0e0">Tipo evento</th>
                  <th style="padding:8px;border-bottom:1px solid #e0e0e0">Fecha evento</th>
                  <th style="padding:8px;border-bottom:1px solid #e0e0e0">Fecha envío</th>
                  <th style="padding:8px;border-bottom:1px solid #e0e0e0">HTTP</th>
                </tr></thead>
                <tbody>
                  <tr *ngFor="let c of coincidencias()" style="border-bottom:1px solid #f5f5f5">
                    <td style="padding:8px"><span [class]="'phase-badge f' + c.fase_busqueda">{{ c.fase_busqueda | faseLabel }}</span></td>
                    <td style="padding:8px">{{ c.tipo_evento || '-' }}</td>
                    <td style="padding:8px">{{ c.fecha_evento | date:'dd/MM/yyyy' }}</td>
                    <td style="padding:8px">{{ c.enviado_en | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td style="padding:8px"><span [style.color]="c.http_status === 200 ? '#388e3c' : '#f44336'">{{ c.http_status }}</span></td>
                  </tr>
                </tbody>
              </table>
              <p *ngIf="!coincidencias().length" style="color:#9e9e9e;text-align:center">Sin coincidencias</p>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`.timeline-event { display:flex;gap:12px;align-items:flex-start;margin-bottom:16px; }`],
})
export class ReporteDetailComponent implements OnInit {
  reporte = signal<Reporte | null>(null);
  coincidencias = signal<Coincidencia[]>([]);
  loading = signal(true);

  constructor(private route: ActivatedRoute, private api: PanelApiService, private auth: AuthService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getReporteTimeline(id).subscribe({
      next: r => { this.reporte.set(r.reporte); this.coincidencias.set(r.coincidencias); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
