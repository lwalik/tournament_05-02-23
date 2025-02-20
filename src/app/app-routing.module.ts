import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductsComponent } from './components/products/products.component';
import { ProductsComponentModule } from './components/products/products.component-module';

const routes: Routes = [{ path: '', component: ProductsComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes), ProductsComponentModule],
  exports: [RouterModule],
})
export class AppRoutingModule {}
