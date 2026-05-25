import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas públicas estáticas — se pueden pre-renderizar
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'registro',
    renderMode: RenderMode.Prerender
  },
  // Rutas que dependen de autenticación o datos dinámicos — solo cliente
  // (localStorage no existe en el servidor, los guards fallarían)
  {
    path: 'usuario',
    renderMode: RenderMode.Client
  },
  {
    path: 'inventario',
    renderMode: RenderMode.Client
  },
  {
    path: 'carrito',
    renderMode: RenderMode.Client
  },
  {
    path: 'buscar',
    renderMode: RenderMode.Client
  },
  {
    path: 'catalogo',
    renderMode: RenderMode.Client
  },
  {
    path: 'producto/:id',
    renderMode: RenderMode.Client
  },
  // Fallback — cliente para cualquier ruta no listada
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
