import { Routes } from '@angular/router';
import { CatalogoComponent } from './components/catalogo/catalogo.component';
import { CarritoComponent } from './components/carrito/carrito.component';
import { BuscarComponent } from './components/buscar/buscar.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UsuarioComponent } from './components/usuario/usuario.component';
import { ProductoDetalleComponent } from './components/producto-detalle/producto-detalle.component';
import { InventarioComponent } from './components/inventario/inventario.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: CatalogoComponent },
  { path: 'carrito', component: CarritoComponent },
  { path: 'buscar', component: BuscarComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'usuario', component: UsuarioComponent, canActivate: [authGuard] },
  { path: 'inventario', component: InventarioComponent, canActivate: [adminGuard] },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'producto/:id', component: ProductoDetalleComponent },
  { path: '**', redirectTo: '' },
];


