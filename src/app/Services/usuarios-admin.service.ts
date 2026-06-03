import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosAdminService {
  private apiUrl = '/api/admin/usuarios';

  constructor(private http: HttpClient) {}

  // Obtener listado de todos los usuarios
  getUsuarios(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Actualizar rol del usuario
  actualizarRol(id: number, rol: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/rol`, { rol });
  }

  // Eliminar un usuario
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
