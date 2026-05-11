import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  usuario: string = '';
  correo: string = '';
  contrasena: string = '';
  contrasenaConfirmar: string = '';
  cargando: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'error' | 'exito' = 'error';

  // Requisitos de validación
  requisitos = {
    longitud: false,
    mayuscula: false,
    numero: false,
    especial: false
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  validarContrasena(): void {
    this.requisitos.longitud = this.contrasena.length >= 6;
    this.requisitos.mayuscula = /[A-Z]/.test(this.contrasena);
    this.requisitos.numero = /[0-9]/.test(this.contrasena);
    this.requisitos.especial = /[!@#$%^&*]/.test(this.contrasena);
  }

  registrar(): void {
    // Validaciones
    if (!this.usuario || !this.correo || !this.contrasena || !this.contrasenaConfirmar) {
      this.mostrarMensaje('Por favor completa todos los campos', 'error');
      return;
    }

    if (this.contrasena !== this.contrasenaConfirmar) {
      this.mostrarMensaje('Las contraseñas no coinciden', 'error');
      return;
    }

    // Validar formato de correo
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(this.correo)) {
      this.mostrarMensaje('Correo electrónico inválido', 'error');
      return;
    }

    // Validar requisitos de contraseña
    if (this.contrasena.length < 6) {
      this.mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    this.authService.registrar(this.usuario, this.correo, this.contrasena).subscribe({
      next: (respuesta) => {
        if (respuesta.success) {
          this.mostrarMensaje('¡Registrado exitosamente! Redirigiendo...', 'exito');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        } else {
          this.mostrarMensaje(respuesta.message || 'Error al registrar', 'error');
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

  private mostrarMensaje(msg: string, tipo: 'error' | 'exito'): void {
    this.mensaje = msg;
    this.tipoMensaje = tipo;
  }

  get todasLasCondicionesCumplidas(): boolean {
    return this.requisitos.longitud &&
           this.requisitos.mayuscula &&
           this.requisitos.numero &&
           this.requisitos.especial;
  }
}
