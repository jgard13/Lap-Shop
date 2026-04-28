import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './buscar.component.html',
  styleUrls: ['./buscar.component.css'],
})
export class BuscarComponent {
  query = '';

  onSearch() {
    // placeholder: en el futuro conectar a servicio de búsqueda
    console.log('Buscar:', this.query);
  }
}
