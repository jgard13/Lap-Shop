import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() add = new EventEmitter<Product>();
  added = false;

  private router = inject(Router);

  goToDetail() {
    this.router.navigate(['/producto', this.product.id]);
  }

  onAdd(event: Event) {
    event.stopPropagation(); // evita que el click de la card dispare goToDetail
    this.added = true;
    this.add.emit(this.product);
    setTimeout(() => (this.added = false), 800);
  }
}
