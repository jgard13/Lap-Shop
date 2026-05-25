import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario: string = '';
  contrasena: string = '';
  cargando: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'error' | 'exito' = 'error';

  // Propiedades para recuperar contraseña
  vistaActual: 'login' | 'solicitar' | 'restablecer' = 'login';
  correoRestablecer: string = '';
  codigoRestablecer: string = '';
  nuevaContrasena: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  iniciarSesion(): void {
    // Validaciones
    if (!this.usuario || !this.contrasena) {
      this.mostrarMensaje('Por favor completa todos los campos', 'error');
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    this.authService.iniciarSesion(this.usuario, this.contrasena).subscribe({
      next: (respuesta) => {
        if (respuesta.success && respuesta.data) {
          this.authService.establecerUsuario(respuesta.data);
          this.mostrarMensaje('¡Sesión iniciada correctamente!', 'exito');
          setTimeout(() => {
            this.router.navigate(['/catalogo']);
          }, 1500);
        } else {
          this.mostrarMensaje(respuesta.message || 'Error al iniciar sesión', 'error');
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje(
          error.error?.message || 'Error al conectar con el servidor',
          'error'
        );
        this.cargando = false;
      }
    });
  }

  cambiarVista(vista: 'login' | 'solicitar' | 'restablecer'): void {
    this.vistaActual = vista;
    this.mensaje = '';
    // Limpiar campos según la vista
    if (vista === 'solicitar') {
      this.correoRestablecer = '';
    } else if (vista === 'restablecer') {
      this.codigoRestablecer = '';
      this.nuevaContrasena = '';
    }
  }

  solicitarCodigo(): void {
    if (!this.correoRestablecer) {
      this.mostrarMensaje('Por favor ingresa tu correo electrónico', 'error');
      return;
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(this.correoRestablecer)) {
      this.mostrarMensaje('Formato de correo electrónico inválido', 'error');
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    this.authService.solicitarRestablecimiento(this.correoRestablecer).subscribe({
      next: (respuesta) => {
        if (respuesta.success) {
          this.mostrarMensaje('Código enviado con éxito. Revisa tu correo.', 'exito');
          setTimeout(() => {
            this.cambiarVista('restablecer');
          }, 1500);
        } else {
          this.mostrarMensaje(respuesta.message || 'Error al solicitar el código', 'error');
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje(
          error.error?.message || 'Error al enviar el código de verificación',
          'error'
        );
        this.cargando = false;
      }
    });
  }

  restablecerContrasena(): void {
    if (!this.correoRestablecer || !this.codigoRestablecer || !this.nuevaContrasena) {
      this.mostrarMensaje('Por favor completa todos los campos', 'error');
      return;
    }

    if (this.codigoRestablecer.length !== 6) {
      this.mostrarMensaje('El código debe ser de 6 dígitos', 'error');
      return;
    }

    if (this.nuevaContrasena.length < 6) {
      this.mostrarMensaje('La nueva contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    this.authService.restablecerContrasena(
      this.correoRestablecer,
      this.codigoRestablecer,
      this.nuevaContrasena
    ).subscribe({
      next: (respuesta) => {
        if (respuesta.success) {
          this.mostrarMensaje('¡Contraseña restablecida correctamente!', 'exito');
          setTimeout(() => {
            this.cambiarVista('login');
          }, 1500);
        } else {
          this.mostrarMensaje(respuesta.message || 'Error al restablecer la contraseña', 'error');
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje(
          error.error?.message || 'Error al restablecer la contraseña',
          'error'
        );
        this.cargando = false;
      }
    });
  }

  private mostrarMensaje(msg: string, tipo: 'error' | 'exito'): void {
    this.mensaje = msg;
    this.tipoMensaje = tipo;
  }
}
