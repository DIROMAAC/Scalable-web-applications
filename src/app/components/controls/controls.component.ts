import { Component, EventEmitter, Output, Input } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [NgClass, NgFor, NgIf],
  templateUrl: './controls.component.html',
  styleUrl: './controls.component.css'
})
export class ControlsComponent {
  @Input() showCategoryFilter: boolean = true;
  
  @Output()
  filterByCategoryEvent = new EventEmitter<string>();

  @Output()
  orderByNameEvent = new EventEmitter<void>();

  @Output()
  orderByPriceEvent = new EventEmitter<boolean>();
  
  @Output()
  filterByPriceRangeEvent = new EventEmitter<{min: number, max: number}>();
  
  activeCategory: string = 'all';
  activeSorting: string = '';
  
  priceRanges = [
    { label: 'Todos', min: 0, max: 1000 },
    { label: 'Menos de $25', min: 0, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: 'Más de $100', min: 100, max: 1000 }
  ];
  
  selectedPriceRange = this.priceRanges[0];

  filterByCategory(category: string): void {
    this.activeCategory = category;
    this.filterByCategoryEvent.emit(category);
  }

  orderByName(): void {
    this.activeSorting = 'name';
    this.orderByNameEvent.emit();
  }

  orderByPrice(ascending: boolean = true): void {
    this.activeSorting = ascending ? 'price-asc' : 'price-desc';
    this.orderByPriceEvent.emit(ascending);
  }
  
  filterByPriceRange(range: {label: string, min: number, max: number}): void {
    this.selectedPriceRange = range;
    // Solo emitimos las propiedades min y max
    this.filterByPriceRangeEvent.emit({
      min: range.min,
      max: range.max
    });
  }
}