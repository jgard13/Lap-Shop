import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    // Obtener productos desde el backend (base de datos)
    // Usar ruta relativa para facilitar proxy durante desarrollo
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

  obtenerFeedbackAsistente(laptops: Product[], etiquetas: string[], precioMin: number, precioMax: number): Observable<{ feedback: string }> {
    return this.http.post<{ feedback: string }>('/api/productos/feedback', {
      laptops,
      userReq: { etiquetas, precio_min: precioMin, precio_max: precioMax }
    });
  }

  private parseProductsXml(xmlText: string): Product[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    if (doc.getElementsByTagName('parsererror').length > 0) {
      return [];
    }

    const nodes = Array.from(doc.getElementsByTagName('product'));

    return nodes.map((node) => ({
      id: this.getNumber(node, 'id'),
      name: this.getText(node, 'name'),
      price: this.getNumber(node, 'price'),
      imageUrl: this.getText(node, 'imageUrl'),
      category: this.getText(node, 'category'),
      description: this.getText(node, 'description'),
      inStock: this.getBoolean(node, 'inStock'),
    }));
  }

  private getText(parent: Element, tag: string): string {
    return parent.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';
  }

  private getNumber(parent: Element, tag: string): number {
    const value = this.getText(parent, tag);
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private getBoolean(parent: Element, tag: string): boolean {
    const value = this.getText(parent, tag).toLowerCase();
    return value === 'true' || value === '1' || value === 'yes';
  }
}
