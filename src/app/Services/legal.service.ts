import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LegalService {
  tipoDocumentoVisible = signal<'terminos' | 'privacidad' | null>(null);

  abrirDocumento(tipo: 'terminos' | 'privacidad'): void {
    this.tipoDocumentoVisible.set(tipo);
  }

  cerrarDocumento(): void {
    this.tipoDocumentoVisible.set(null);
  }
}
