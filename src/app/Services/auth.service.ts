import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';
import { Usuario, RespuestaAuth } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private usuarioActual = new BehaviorSubject<Usuario | null>(null);
  public usuarioActual$ = this.usuarioActual.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarUsuarioGuardado();
    }
  }

  // Registrar nuevo usuario
  registrar(usuario: string, correo: string, contrasena: string): Observable<RespuestaAuth> {
    return this.http.post<RespuestaAuth>(`${this.apiUrl}/auth/registrar`, {
      usuario,
      correo,
      contrasena
    });
  }

  // Iniciar sesión
  iniciarSesion(usuario: string, contrasena: string): Observable<RespuestaAuth> {
    return this.http.post<RespuestaAuth>(`${this.apiUrl}/auth/iniciar-sesion`, {
      usuario,
      contrasena
    });
  }

  // Obtener usuario actual
  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActual.value;
  }

  // Establecer usuario actual
  establecerUsuario(usuario: Usuario): void {
    this.usuarioActual.next(usuario);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('usuarioActual', JSON.stringify(usuario));
      if (usuario.token) {
        localStorage.setItem('token', usuario.token);
      }
    }
  }

  // Cargar usuario guardado del localStorage
  cargarUsuarioGuardado(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const usuarioGuardado = localStorage.getItem('usuarioActual');
    if (usuarioGuardado) {
      try {
        const user = JSON.parse(usuarioGuardado);
        // Si el token no está incrustado en el objeto de usuarioActual, cargarlo por separado
        if (!user.token) {
          const token = localStorage.getItem('token');
          if (token) user.token = token;
        }
        this.usuarioActual.next(user);
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    }
  }

  // Cerrar sesión
  cerrarSesion(): void {
    this.usuarioActual.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioActual');
      localStorage.removeItem('token');
    }
  }

  // Obtener el token JWT activo
  obtenerToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const user = this.usuarioActual.value;
      if (user && user.token) {
        return user.token;
      }
      return localStorage.getItem('token');
    }
    return null;
  }

  // Verificar si está autenticado
  estaAutenticado(): boolean {
    return this.usuarioActual.value !== null;
  }

  // Obtener datos del usuario
  obtenerUsuario(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuario/${id}`);
  }

  // Actualizar datos del perfil
  actualizarPerfil(usuario: string, correo: string, contrasena?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/user/profile`, {
      usuario,
      correo,
      contrasena
    });
  }

  // Obtener historial de pedidos
  obtenerHistorialPedidos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/history`);
  }
}
