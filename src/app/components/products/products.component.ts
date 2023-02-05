import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import {
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { StoreModel } from '../../models/store.model';
import { PriceFormQueryModel } from '../../query-models/price-form.query-model';
import { RatingOptionQueryModel } from '../../query-models/rating-option.query-model';
import { SortFormModel } from '../../models/sort-form.model';
import { ProductModel } from '../../models/product.model';
import { PageNumberOptionsQueryModel } from '../../query-models/page-number-options.query-model';
import { ProductCardWithCategoryQueryModel } from '../../query-models/product-card-with-category.query-model';
import { CategoriesService } from '../../services/categories.service';
import { StoresService } from '../../services/stores.service';
import { ProductsService } from '../../services/products.service';
import { SortOptionsService } from '../../services/sort-options.service';

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
      startWith([]),
      map((form) => Object.keys(form).filter((k) => form[k] === true)),
      shareReplay(1)
    );

  // stores
  readonly stores$: Observable<StoreModel[]> = this._storesService
    .getAll()
    .pipe(tap((stores) => this._addControlsToStoresForm(stores)));
  readonly storesForm: FormGroup = new FormGroup({});
  readonly storesFormValue$: Observable<string[]> =
    this.storesForm.valueChanges.pipe(
      startWith([]),
      map((form) => Object.keys(form).filter((k) => form[k] === true)),
      shareReplay(1)
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
  ]).pipe(
    tap((ratingOptions) => this._addControlsToRatingForm(ratingOptions)),
    shareReplay(1)
  );
  readonly ratingForm: FormGroup = new FormGroup({});
  readonly ratingFormValue$: Observable<number[]> =
    this.ratingForm.valueChanges.pipe(
      startWith([]),
      map((form) =>
        Object.keys(form).reduce(
          (a, c) => (form[c] === true ? [...a, +c] : a),
          [] as number[]
        )
      ),
      shareReplay(1)
    );

  // limitForm
  readonly limitForm: FormControl = new FormControl(6);
  readonly limitFormValue$: Observable<number> =
    this.limitForm.valueChanges.pipe(startWith(6), shareReplay(1));
  readonly limitOptions$: Observable<number[]> = of([6, 12, 18]);

  // sortForm
  readonly sortOptions$: Observable<Record<string, SortFormModel>> =
    this._sortOptionsService.getAll().pipe(shareReplay(1));

  readonly displaySortOptions$: Observable<string[]> = this.sortOptions$.pipe(
    map((sortOptions) => Object.keys(sortOptions))
  );
  readonly sortForm: FormControl = new FormControl('Featured');
  readonly sortFormValue$: Observable<SortFormModel> = combineLatest([
    this.sortForm.valueChanges.pipe(startWith('Featured')),
    this.sortOptions$,
  ]).pipe(
    map(
      ([sortValue, sortOptions]: [string, Record<string, SortFormModel>]) =>
        sortOptions[sortValue]
    )
  );

  // pageNumber
  private _pageNumberSubject: BehaviorSubject<number> =
    new BehaviorSubject<number>(1);
  public pageNumber$: Observable<number> = this._pageNumberSubject
    .asObservable()
    .pipe(shareReplay(1));

  // products
  readonly products$: Observable<ProductModel[]> = combineLatest([
    this._productsService.getAll(),
    this.sortFormValue$,
    this.categoriesFormValue$,
    this.storesFormValue$,
    this.priceFormValue$,
    this.ratingFormValue$,
  ]).pipe(
    map(
      ([
        products,
        sortValue,
        categoriesFormValue,
        storesFormValue,
        priceFormValue,
        ratingFormValue,
      ]) =>
        this._sortProducts(products, sortValue)
          .filter((product) =>
            categoriesFormValue.length > 0
              ? categoriesFormValue.includes(product.categoryId)
              : true
          )
          .filter((product) =>
            storesFormValue.length > 0
              ? product.storeIds.filter((sId) => storesFormValue.includes(sId))
                  .length > 0
              : true
          )
          .filter((product) => {
            const priceFrom: number = priceFormValue.priceFrom ?? 0;
            const priceTo: number = priceFormValue.priceTo ?? Infinity;
            return product.price >= priceFrom && product.price <= priceTo;
          })
          .filter((product) =>
            ratingFormValue.length > 0
              ? ratingFormValue.includes(Math.floor(product.ratingValue))
              : true
          )
    ),
    shareReplay(1)
  );

  readonly pageNumberOptions$: Observable<PageNumberOptionsQueryModel> =
    combineLatest([this.products$, this.limitFormValue$]).pipe(
      map(([products, limitValue]) => {
        const maxPages: number = Math.ceil(products.length / limitValue);
        return {
          pages: new Array(maxPages).fill(0).map((_, idx) => +idx + 1) ?? [1],
          lastPage: maxPages ?? 1,
        };
      }),
      tap((options) => this._checkCurrentPage(options.lastPage))
    );

  readonly displayProducts$: Observable<ProductCardWithCategoryQueryModel[]> =
    combineLatest([
      this.products$,
      this.categories$,
      this.limitFormValue$,
      this.pageNumber$,
    ]).pipe(
      map(
        ([products, categories, limitValue, pageNumber]: [
          ProductModel[],
          CategoryModel[],
          number,
          number
        ]) =>
          this._mapToProductCardWithCategoryQuery(products, categories).slice(
            (pageNumber - 1) * limitValue,
            pageNumber * limitValue
          )
      )
    );

  constructor(
    private _categoriesService: CategoriesService,
    private _storesService: StoresService,
    private _productsService: ProductsService,
    private _sortOptionsService: SortOptionsService
  ) {}

  onPageNumberClicked(pageNumber: number): void {
    this._pageNumberSubject.next(pageNumber);
  }

  onPrevPageBtnClicked(): void {
    this._pageNumberSubject.next(this._pageNumberSubject.getValue() - 1);
  }

  onNextPageBtnClicked(): void {
    this._pageNumberSubject.next(this._pageNumberSubject.getValue() + 1);
  }

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

  private _sortProducts(
    products: ProductModel[],
    sortValue: SortFormModel
  ): ProductModel[] {
    return products.sort((a: Record<string, any>, b: Record<string, any>) =>
      sortValue.order === 'asc'
        ? a[sortValue.sortBy] - b[sortValue.sortBy]
        : b[sortValue.sortBy] - a[sortValue.sortBy]
    );
  }

  private _checkCurrentPage(maxPage: number): void {
    const curPage: number = this._pageNumberSubject.getValue();
    if (curPage > maxPage) {
      this._pageNumberSubject.next(1);
    }
  }
}
