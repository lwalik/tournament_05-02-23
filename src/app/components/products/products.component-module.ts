import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ProductsComponent } from './products.component';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule],
  declarations: [ProductsComponent],
  providers: [],
  exports: [ProductsComponent]
})
export class ProductsComponentModule {
}
