import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, combineLatest, of } from 'rxjs';
import { filter, map, shareReplay, startWith, tap } from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { StoreModel } from '../../models/store.model';
import { PriceFormQueryModel } from '../../query-models/price-form.query-model';
import { RatingOptionQueryModel } from '../../query-models/rating-option.query-model';
import { ProductCardWithCategoryQueryModel } from '../../query-models/product-card-with-category.query-model';
import { ProductModel } from '../../models/product.model';
import { CategoriesService } from '../../services/categories.service';
import { StoresService } from '../../services/stores.service';
import { ProductsService } from '../../services/products.service';
import { LimitFormQueryModel } from 'src/app/query-models/limit-form.query-model';

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
    .pipe(
      tap((categories) => this._addControlsToCategoriesForm(categories)),
      shareReplay(1)
    );
  readonly categoriesForm: FormGroup = new FormGroup({});
  readonly categoriesFormValue$: Observable<string[]> =
    this.categoriesForm.valueChanges.pipe(
      tap(console.log),
      map((form) => Object.keys(form).filter((k) => form[k] === true))
    );

  // stores
  readonly stores$: Observable<StoreModel[]> = this._storesService
    .getAll()
    .pipe(tap((stores) => this._addControlsToStoresForm(stores)));
  readonly storesForm: FormGroup = new FormGroup({});
  readonly storesFormValue$: Observable<string[]> =
    this.storesForm.valueChanges.pipe(
      tap(console.log),
      map((form) => Object.keys(form).filter((k) => form[k] === true))
    );

  // priceForm
  readonly priceForm: FormGroup = new FormGroup({
    priceFrom: new FormControl(),
    priceTo: new FormControl(),
  });
  readonly priceFormValue$: Observable<PriceFormQueryModel> =
    this.priceForm.valueChanges.pipe(
      startWith({ priceFrom: 0, priceTo: Infinity })
    );

  // ratingForm
  readonly ratingOptions$: Observable<RatingOptionQueryModel[]> = of([
    { id: '1', value: 5, stars: [1, 1, 1, 1, 1] },
    { id: '2', value: 4, stars: [1, 1, 1, 1, 0] },
    { id: '3', value: 3, stars: [1, 1, 1, 0, 0] },
    { id: '4', value: 2, stars: [1, 1, 0, 0, 0] },
    { id: '5', value: 1, stars: [1, 0, 0, 0, 0] },
  ]).pipe(tap((ratingOptions) => this._addControlsToRatingForm(ratingOptions)));
  readonly ratingForm: FormGroup = new FormGroup({});
  readonly ratingFormValue$: Observable<number[]> =
    this.ratingForm.valueChanges.pipe(
      map((form) =>
        Object.keys(form).reduce(
          (a, c) => (form[c] === true ? [...a, +c] : a),
          [] as number[]
        )
      )
    );

  // limitForm
  readonly limitForm: FormControl = new FormControl(6);
  readonly limitFormValue$: Observable<number> =
    this.limitForm.valueChanges.pipe(startWith(6), shareReplay(1));

  readonly limitOptions$: Observable<number[]> = of([6, 12, 18]);

  // products
  readonly products$: Observable<ProductModel[]> = this._productsService
    .getAll()
    .pipe(shareReplay(1));

  readonly displayProducts$: Observable<ProductCardWithCategoryQueryModel[]> =
    combineLatest([
      this.products$,
      this.categories$,
      this.limitFormValue$,
    ]).pipe(
      map(
        ([products, categories, limitValue]: [
          ProductModel[],
          CategoryModel[],
          number
        ]) =>
          this._mapToProductCardWithCategoryQuery(products, categories).slice(
            0,
            limitValue
          )
      )
    );

  constructor(
    private _categoriesService: CategoriesService,
    private _storesService: StoresService,
    private _productsService: ProductsService
  ) {}

  private _addControlsToCategoriesForm(categories: CategoryModel[]): void {
    categories.forEach((c) => {
      this.categoriesForm.addControl(c.id, new FormControl(false));
    });
  }

  private _addControlsToStoresForm(stores: StoreModel[]): void {
    stores.forEach((s) => {
      this.storesForm.addControl(s.id, new FormControl(false));
    });
  }

  private _addControlsToRatingForm(
    ratingOptions: RatingOptionQueryModel[]
  ): void {
    ratingOptions.forEach((r) => {
      this.ratingForm.addControl(r.id, new FormControl(false));
    });
  }

  private _mapToProductCardWithCategoryQuery(
    products: ProductModel[],
    categories: CategoryModel[]
  ): ProductCardWithCategoryQueryModel[] {
    const categoryMap = categories.reduce(
      (a, c) => ({ ...a, [c.id]: c }),
      {}
    ) as Record<string, CategoryModel>;

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      featureValue: product.featureValue,
      imageUrl: product.imageUrl,
      price: product.price,
      ratingValue: product.ratingValue,
      ratingCount: product.ratingCount,
      ratingOptions: this._mapToRatingOptions(product.ratingValue),
      categoryName: categoryMap[product.categoryId]?.name,
      storeIds: product.storeIds,
    }));
  }

  private _mapToRatingOptions(ratingValue: number): number[] {
    return new Array(5).fill(0).map((_, idx) => {
      return ratingValue >= idx + 1 ? 1 : ratingValue > idx ? 0.5 : 0;
    });
  }
}
