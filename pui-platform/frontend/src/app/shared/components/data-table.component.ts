import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule],
  template: `
    <div *ngIf="loading" style="display:flex;justify-content:center;padding:40px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>
    <ng-content *ngIf="!loading"></ng-content>
    <mat-paginator *ngIf="!loading && total > 0"
      [length]="total"
      [pageSize]="pageSize"
      [pageSizeOptions]="[10, 20, 50]"
      (page)="page.emit($event)"
      showFirstLastButtons>
    </mat-paginator>
  `,
})
export class DataTableComponent {
  @Input() loading = false;
  @Input() total = 0;
  @Input() pageSize = 20;
  @Output() page = new EventEmitter<PageEvent>();
}
