import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = '/api/inventario';

  constructor(private http: HttpClient) {}

  // Obtener todos los productos (incluyendo inactivos para el administrador)
  getProductos(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Crear un producto nuevo
  crearProducto(producto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, producto);
  }

  // Actualizar un producto existente
  actualizarProducto(id: number, producto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, producto);
  }

  // Desactivar un producto (borrado virtual)
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
