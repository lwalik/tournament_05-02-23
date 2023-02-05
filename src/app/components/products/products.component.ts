import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { filter, map, startWith, tap } from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { StoreModel } from '../../models/store.model';
import { PriceFormQueryModel } from '../../query-models/price-form.query-model';
import { CategoriesService } from '../../services/categories.service';
import { StoresService } from '../../services/stores.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent {
  // categories
  readonly categories$: Observable<CategoryModel[]> = this._categoriesService
    .getAll()
    .pipe(tap((categories) => this.addControlsToCategoriesForm(categories)));
  readonly categoriesForm: FormGroup = new FormGroup({});
  readonly categoriesFormValue$: Observable<string[]> =
    this.categoriesForm.valueChanges.pipe(
      tap(console.log),
      map((form) => Object.keys(form).filter((k) => form[k] === true))
    );

  //stores
  readonly stores$: Observable<StoreModel[]> = this._storesService
    .getAll()
    .pipe(tap((stores) => this.addControlsToStoresForm(stores)));
  readonly storesForm: FormGroup = new FormGroup({});
  readonly storesFormValue$: Observable<string[]> =
    this.storesForm.valueChanges.pipe(
      tap(console.log),
      map((form) => Object.keys(form).filter((k) => form[k] === true))
    );

  //priceForm
  readonly priceForm: FormGroup = new FormGroup({
    priceFrom: new FormControl(),
    priceTo: new FormControl(),
  });
  readonly priceFormValue$: Observable<PriceFormQueryModel> =
    this.priceForm.valueChanges.pipe(
      startWith({ priceFrom: 0, priceTo: Infinity })
    );

  constructor(
    private _categoriesService: CategoriesService,
    private _storesService: StoresService
  ) {}

  addControlsToCategoriesForm(categories: CategoryModel[]): void {
    categories.forEach((c) => {
      this.categoriesForm.addControl(c.id, new FormControl(false));
    });
  }

  addControlsToStoresForm(stores: StoreModel[]): void {
    stores.forEach((s) => {
      this.storesForm.addControl(s.id, new FormControl(false));
    });
  }
}
