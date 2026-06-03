import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/productos');
  }

  buscar(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`/api/productos/buscar?q=${query}`);
  }

  getFavoritos(usuarioId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`/api/favoritos/${usuarioId}`);
  }

  getVistos(usuarioId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`/api/vistos/${usuarioId}`);
  }

  filtrar(etiquetas: string[], precioMin: number, precioMax: number, modo: string): Observable<any> {
    return this.http.post<any>('/api/productos/filtrar', { etiquetas, precio_min: precioMin, precio_max: precioMax, modo });
  }

  // ---- Favoritos (requieren token JWT) ----

  checkFavorito(computadoraId: number): Observable<{ esFavorito: boolean }> {
    return this.http.get<{ esFavorito: boolean }>(`/api/favorito/${computadoraId}/check`);
  }

  agregarFavorito(computadoraId: number): Observable<any> {
    return this.http.post<any>(`/api/favorito/${computadoraId}`, {});
  }

  quitarFavorito(computadoraId: number): Observable<any> {
    return this.http.delete<any>(`/api/favorito/${computadoraId}`);
  }

  // ---- Historial de vistos (requiere token JWT) ----

  registrarVisto(computadoraId: number): Observable<any> {
    return this.http.post<any>(`/api/visto/${computadoraId}`, {});
  }
}
