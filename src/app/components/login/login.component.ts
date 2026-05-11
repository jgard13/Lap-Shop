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

  private mostrarMensaje(msg: string, tipo: 'error' | 'exito'): void {
    this.mensaje = msg;
    this.tipoMensaje = tipo;
  }
}
