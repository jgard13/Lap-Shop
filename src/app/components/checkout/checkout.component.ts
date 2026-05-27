import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { CarritoService } from '../../Services/carrito.service';
import { PaypalService } from '../../Services/paypal.service';

declare const paypal: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, NgClass],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements AfterViewInit {
  @ViewChild('paypalButtonContainer') paypalButtonContainer!: ElementRef<HTMLDivElement>;

  private carritoService = inject(CarritoService);
  private paypalService = inject(PaypalService);

  carrito = this.carritoService.items;
  total = computed(() => this.carritoService.total());

  mensaje = '';

  ngAfterViewInit(): void {
    this.renderPaypalButton();
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
          const response = await firstValueFrom(
            this.paypalService.crearOrder({ items: this.carrito(), total: this.total() })
          );
          return response.id;
        } catch (error) {
          console.error('Error al crear la orden:', error);
          this.mensaje = 'No se pudo crear la orden.';
          throw error;
        }
      },

      onApprove: async (data: any) => {
        try {
          const capture = await firstValueFrom(this.paypalService.capturarOrder(data.orderID, this.carrito()));
          console.log('Pago capturado:', capture);
          
          // Generar recibo automáticamente después del pago exitoso
          this.carritoService.generarReciboPago(data.orderID);
          
          this.mensaje = 'Pago realizado correctamente. Tu recibo ha sido descargado.';
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
