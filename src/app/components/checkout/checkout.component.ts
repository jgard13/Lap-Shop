import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CarritoService } from '../../Services/carrito.service';
import { PaypalService } from '../../Services/paypal.service';
import { AuthService } from '../../Services/auth.service';

declare const paypal: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, NgClass, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements AfterViewInit {
  @ViewChild('paypalButtonContainer') paypalButtonContainer!: ElementRef<HTMLDivElement>;

  private carritoService = inject(CarritoService);
  private paypalService = inject(PaypalService);
  private authService = inject(AuthService);

  carrito = this.carritoService.items;
  total = computed(() => this.carritoService.total());

  emailInvitado = '';
  mensaje = '';

  ngAfterViewInit(): void {
    this.renderPaypalButton();
  }

  esInvitado(): boolean {
    return !this.authService.obtenerUsuarioActual();
  }

  esEmailValido(): boolean {
    if (!this.esInvitado()) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.emailInvitado);
  }

  private async renderPaypalButton(): Promise<void> {
    if (this.carrito().length === 0) return;

    if (typeof paypal === 'undefined') {
      this.mensaje = 'No se cargó el SDK de PayPal.';
      return;
    }

    if (!this.paypalButtonContainer) return;

    this.paypalButtonContainer.nativeElement.innerHTML = '';

    paypal.Buttons({
      createOrder: async () => {
        try {
          if (this.esInvitado() && !this.esEmailValido()) {
            this.mensaje = 'Por favor, introduce un correo electrónico válido antes de pagar.';
            throw new Error('Email inválido');
          }
          const response = await firstValueFrom(
            this.paypalService.crearOrder({ items: this.carrito(), total: this.total() })
          );
          return response.id;
        } catch (error) {
          console.error('Error al crear la orden:', error);
          if (!this.mensaje) {
            this.mensaje = 'No se pudo crear la orden.';
          }
          throw error;
        }
      },

      onApprove: async (data: any) => {
        try {
          const guestEmail = this.esInvitado() ? this.emailInvitado : undefined;
          const capture = await firstValueFrom(
            this.paypalService.capturarOrder(data.orderID, this.carrito(), guestEmail)
          );
          console.log('Pago capturado:', capture);
          
          // El comprobante CFDI se genera y envía por correo desde el servidor backend
          this.mensaje = 'Pago realizado correctamente. Tu comprobante CFDI ha sido enviado a tu correo.';
          this.carritoService.vaciar();
          this.paypalButtonContainer.nativeElement.innerHTML = '';
        } catch (error) {
          console.error('Error al capturar el pago:', error);
          this.mensaje = 'Ocurrió un error al capturar el pago.';
        }
      },

      onCancel: () => {
        this.mensaje = 'El usuario canceló el pago.';
      },

      onError: (error: any) => {
        console.error('Error PayPal:', error);
        this.mensaje = 'Error en el proceso de PayPal.';
      }
    }).render(this.paypalButtonContainer.nativeElement);
  }
}
