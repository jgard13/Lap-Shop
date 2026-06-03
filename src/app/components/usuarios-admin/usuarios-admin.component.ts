import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { UsuariosAdminService } from '../../Services/usuarios-admin.service';
import { AuthService } from '../../Services/auth.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.css']
})
export class UsuariosAdminComponent implements OnInit {
  usuarios: any[] = [];
  usuarioActual: Usuario | null = null;
  cargando = true;
  eliminandoId: number | null = null;
  errorMsg = '';
  exitoMsg = '';

  constructor(
    private usuariosAdminService: UsuariosAdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.usuarioActual = this.authService.obtenerUsuarioActual();
      this.cargarUsuarios();
    }
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
    this.usuariosAdminService.getUsuarios().subscribe({
      next: (res) => {
        if (res.success) {
          this.usuarios = res.data;
        } else {
          this.errorMsg = 'No se pudieron cargar los usuarios.';
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.errorMsg = 'Error al conectar con el servidor.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarRol(user: any, nuevoRol: string): void {
    if (user.id === this.usuarioActual?.id) {
      this.errorMsg = 'No puedes cambiar tu propio rol.';
      this.cdr.detectChanges();
      setTimeout(() => {
        this.errorMsg = '';
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    this.errorMsg = '';
    this.exitoMsg = '';
    this.cdr.detectChanges();

    this.usuariosAdminService.actualizarRol(user.id, nuevoRol).subscribe({
      next: (res) => {
        if (res.success) {
          this.exitoMsg = `Rol de ${user.usuario} actualizado a ${nuevoRol} con éxito.`;
          this.cargarUsuarios();
          setTimeout(() => {
            this.exitoMsg = '';
            this.cdr.detectChanges();
          }, 3000);
        } else {
          this.errorMsg = res.message || 'Error al actualizar el rol.';
          setTimeout(() => {
            this.errorMsg = '';
            this.cdr.detectChanges();
          }, 3000);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar rol:', err);
        this.errorMsg = err.error?.message || 'Error al actualizar el rol en el servidor.';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.errorMsg = '';
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  eliminarUsuario(user: any): void {
    if (user.id === this.usuarioActual?.id) {
      this.errorMsg = 'No puedes eliminar tu propia cuenta.';
      this.cdr.detectChanges();
      setTimeout(() => {
        this.errorMsg = '';
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario "${user.usuario}"? Esta acción no se puede deshacer.`)) {
      this.errorMsg = '';
      this.exitoMsg = '';
      this.eliminandoId = user.id;
      this.cdr.detectChanges();

      this.usuariosAdminService.eliminarUsuario(user.id).subscribe({
        next: (res) => {
          this.eliminandoId = null;
          if (res.success) {
            this.exitoMsg = `Usuario ${user.usuario} eliminado exitosamente.`;
            this.cargarUsuarios();
            setTimeout(() => {
              this.exitoMsg = '';
              this.cdr.detectChanges();
            }, 3000);
          } else {
            this.errorMsg = res.message || 'Error al eliminar el usuario.';
            setTimeout(() => {
              this.errorMsg = '';
              this.cdr.detectChanges();
            }, 3000);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
          this.eliminandoId = null;
          this.errorMsg = err.error?.message || 'Error al eliminar el usuario en el servidor.';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.errorMsg = '';
            this.cdr.detectChanges();
          }, 3000);
        }
      });
    }
  }
}
