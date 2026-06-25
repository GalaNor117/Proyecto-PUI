import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardData {
  reportes: { activos: number; total: number; esta_semana: number };
  coincidencias: { total: number; por_fase: { fase1: number; fase2: number; fase3: number }; este_mes: number };
  sistema: { ultima_sincronizacion: string; estado_conexion_pui: 'ok' | 'error'; scheduler_activo: boolean };
}

export interface Reporte {
  id: string; curp: string; nombre?: string; primer_apellido?: string; segundo_apellido?: string;
  fecha_nacimiento?: string; fecha_desaparicion?: string; lugar_nacimiento?: string;
  sexo_asignado?: string; telefono?: string; correo?: string; activo: boolean;
  fecha_activacion: string; fecha_desactivacion?: string; fase1_completada: boolean; fase2_completada: boolean;
}

export interface Coincidencia {
  id: number; reporte_id: string; fase_busqueda: string; tipo_evento?: string;
  fecha_evento?: string; http_status?: number; enviado_en: string;
}

export interface Log {
  id: number; timestamp: string; tipo: string; reporte_id?: string;
  curp_hash?: string; endpoint?: string; fase_busqueda?: string;
  http_status?: number; error_mensaje?: string;
}

export interface PaginatedResult<T> {
  datos: T[]; total: number; pagina: number; total_paginas: number;
}

export interface VerificacionCurp {
  curp: string;
  extraviada: boolean;
  reporte?: Reporte;
  verificado_en: string;
}

@Injectable({ providedIn: 'root' })
export class PanelApiService {
  private readonly base = `${environment.apiUrl}/panel`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.base}/dashboard`);
  }

  getReportes(params: { pagina?: number; limite?: number; activo?: string; busqueda?: string } = {}): Observable<PaginatedResult<Reporte>> {
    let p = new HttpParams();
    if (params.pagina) p = p.set('pagina', params.pagina);
    if (params.limite) p = p.set('limite', params.limite);
    if (params.activo !== undefined) p = p.set('activo', params.activo);
    if (params.busqueda) p = p.set('busqueda', params.busqueda);
    return this.http.get<PaginatedResult<Reporte>>(`${this.base}/reportes`, { params: p });
  }

  getReporte(id: string): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.base}/reportes/${id}`);
  }

  getReporteTimeline(id: string): Observable<{ reporte: Reporte; coincidencias: Coincidencia[] }> {
    return this.http.get<{ reporte: Reporte; coincidencias: Coincidencia[] }>(`${this.base}/reportes/${id}/timeline`);
  }

  getCoincidencias(params: { pagina?: number; limite?: number; reporte_id?: string; fase?: string; desde?: string } = {}): Observable<PaginatedResult<Coincidencia>> {
    let p = new HttpParams();
    if (params.pagina) p = p.set('pagina', params.pagina);
    if (params.limite) p = p.set('limite', params.limite);
    if (params.reporte_id) p = p.set('reporte_id', params.reporte_id);
    if (params.fase) p = p.set('fase', params.fase);
    if (params.desde) p = p.set('desde', params.desde);
    return this.http.get<PaginatedResult<Coincidencia>>(`${this.base}/coincidencias`, { params: p });
  }

  verificarCurp(curp: string): Observable<VerificacionCurp> {
    return this.http.get<VerificacionCurp>(`${this.base}/verificar-curp/${encodeURIComponent(curp)}`);
  }

  getLogs(params: { pagina?: number; limite?: number; tipo?: string; desde?: string; hasta?: string } = {}): Observable<PaginatedResult<Log>> {
    let p = new HttpParams();
    if (params.pagina) p = p.set('pagina', params.pagina);
    if (params.limite) p = p.set('limite', params.limite);
    if (params.tipo) p = p.set('tipo', params.tipo);
    if (params.desde) p = p.set('desde', params.desde);
    if (params.hasta) p = p.set('hasta', params.hasta);
    return this.http.get<PaginatedResult<Log>>(`${this.base}/logs`, { params: p });
  }
}
