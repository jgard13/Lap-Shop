import { Component, OnInit, inject, signal, PLATFORM_ID, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ProductsService } from '../../Services/product.service';
import { CarritoService } from '../../Services/carrito.service';
import { Product } from '../../models/product.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './producto-detalle.component.html',
  styleUrls: ['./producto-detalle.component.css'],
})
export class ProductoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private carritoService = inject(CarritoService);
  private platformId = inject(PLATFORM_ID);

  product = signal<Product | null>(null);
  loading = signal(true);
  added = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productsService.getAll().subscribe({
      next: (products) => {
        const found = products.find(p => p.id === id) ?? null;
        this.product.set(found);
        this.loading.set(false);
        
        if (found && isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.renderChart(found), 0);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  volverAlCatalogo() {
    this.router.navigate(['/catalogo']);
  }

  agregarAlCarrito(p: Product) {
    this.carritoService.agregar(p);
    this.added.set(true);
    setTimeout(() => this.added.set(false), 1200);
  }

  getCategorias(p: Product): string[] {
    if (!p.category) return [];
    return p.category.split(',').map(c => c.trim()).filter(Boolean);
  }

  getSpecs(p: Product): { key: string; value: string }[] {
    if (!p.description) return [];
    const parts = p.description.split('|');
    if (parts.length > 1) {
      return parts.map(s => {
        const [k, ...rest] = s.split(':');
        return { key: k?.trim() ?? '', value: rest.join(':').trim() };
      }).filter(s => s.key && s.value);
    }
    return [];
  }

  hasSpecs(p: Product): boolean {
    return this.getSpecs(p).length > 0;
  }

  // --- Chart Logic ---

  private renderChart(p: Product) {
    const ctx = document.getElementById('radarChart') as HTMLCanvasElement;
    if (!ctx) return;

    const specs = this.getSpecs(p);
    let ramStr = '', cpuStr = '', gpuStr = '', memStr = '';

    // Intentar buscar los valores en las especificaciones si existen
    for (const s of specs) {
      const k = s.key.toLowerCase();
      if (k.includes('ram')) ramStr = s.value;
      if (k.includes('procesador') || k.includes('cpu')) cpuStr = s.value;
      if (k.includes('gráfico') || k.includes('gpu') || k.includes('tarjeta')) gpuStr = s.value;
      if (k.includes('almacenamiento') || k.includes('disco') || k.includes('ssd')) memStr = s.value;
    }

    // Si no hay specs claras, intentar parsear del nombre o descripción entera
    const searchString = (p.name + ' ' + (p.description || '')).toLowerCase();
    if (!ramStr) ramStr = searchString;
    if (!cpuStr) cpuStr = searchString;
    if (!gpuStr) gpuStr = searchString;
    if (!memStr) memStr = searchString;

    const ramVal = this.parseRAM(ramStr);
    const cpuTier = this.getCPUTier(cpuStr);
    const scoreVelocidad = ((ramVal / 32) * 5) + ((cpuTier / 9) * 5); // Max 10

    const gpuTier = this.getGPUTier(gpuStr);
    const scoreGraficos = (gpuTier / 10) * 10;

    const ssdVal = this.parseSSD(memStr);
    const scoreCapacidad = Math.min((ssdVal / 1024) * 10, 10);

    const precio = p.price;
    let scorePrecio = 0;
    if (precio < 10000) scorePrecio = 10;
    else if (precio < 20000) scorePrecio = 8;
    else if (precio < 30000) scorePrecio = 6;
    else if (precio < 45000) scorePrecio = 4;
    else scorePrecio = 2;

    let scoreBateria = 8;
    if (gpuTier > 5 || cpuTier > 7) scoreBateria = 4;
    else if (gpuTier > 3 || cpuTier > 5) scoreBateria = 6;

    const data = {
        labels: ['Velocidad', 'Batería', 'Capacidad', 'Gráficos', 'Precio'],
        datasets: [{
            label: 'Desempeño',
            data: [
                Math.min(scoreVelocidad, 10).toFixed(1),
                scoreBateria,
                scoreCapacidad.toFixed(1),
                scoreGraficos.toFixed(1),
                scorePrecio
            ],
            fill: true,
            backgroundColor: 'rgba(160, 118, 249, 0.2)',
            borderColor: '#A076F9',
            pointBackgroundColor: '#A076F9',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#A076F9'
        }]
    };

    new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            elements: { line: { borderWidth: 2 } },
            scales: {
                r: {
                    angleLines: { display: true },
                    suggestedMin: 0,
                    suggestedMax: 10,
                    ticks: { display: false, stepSize: 2 }
                }
            },
            plugins: { legend: { display: false } },
            maintainAspectRatio: false
        }
    });
  }

  private parseRAM(str: string): number {
    const match = str.match(/(\d+)\s*gb\s*ram/i) || str.match(/(\d+)\s*gb/i) || str.match(/(\d+)/);
    return match ? parseInt(match[1]) : 8;
  }

  private parseSSD(str: string): number {
    const match = str.match(/(\d+)\s*(GB|TB)/i);
    if (!match) return 256;
    let valor = parseInt(match[1]);
    if (match[2].toUpperCase() === 'TB' || match[1] === "1") {
        if (match[1] === "1" && !str.toUpperCase().includes("GB")) valor = 1024;
        else if (match[2].toUpperCase() === 'TB') valor *= 1024;
    }
    return valor;
  }

  private getCPUTier(str: string): number {
    if (str.includes('i9') || str.includes('ryzen 9')) return 9;
    if (str.includes('i7') || str.includes('ryzen 7')) return 7;
    if (str.includes('i5') || str.includes('ryzen 5')) return 5;
    if (str.includes('i3') || str.includes('ryzen 3')) return 3;
    return 2;
  }

  private getGPUTier(str: string): number {
    if (str.includes('4090') || str.includes('4080')) return 10;
    if (str.includes('4070') || str.includes('3080')) return 9;
    if (str.includes('4060') || str.includes('3070')) return 8;
    if (str.includes('4050') || str.includes('3060')) return 7;
    if (str.includes('3050') || str.includes('1650')) return 5;
    if (str.includes('rtx')) return 6;
    if (str.includes('gtx')) return 4;
    return 3;
  }
}

