import { Component, EventEmitter, Input, Output } from '@angular/core';
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

  onAdd() {
    // marcar feedback visual local y emitir evento
    this.added = true;
    this.add.emit(this.product);

    // quitar el indicador después de una animación corta
    setTimeout(() => (this.added = false), 800);
  }
}
