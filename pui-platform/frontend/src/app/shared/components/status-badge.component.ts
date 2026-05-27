import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  template: `
    <span [class]="'status-badge ' + (active ? 'active' : 'inactive')">
      <mat-icon style="font-size:14px;height:14px;width:14px;vertical-align:middle">
        {{ active ? 'check_circle' : 'cancel' }}
      </mat-icon>
      {{ active ? 'Activo' : 'Inactivo' }}
    </span>
  `,
  styles: [`
    .status-badge { display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:12px;font-size:0.8rem;font-weight:600; }
    .active { background:#e8f5e9;color:#2e7d32; }
    .inactive { background:#f5f5f5;color:#757575; }
  `],
})
export class StatusBadgeComponent {
  @Input() active = false;
}
