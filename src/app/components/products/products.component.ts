import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { map, Observable, tap } from 'rxjs';
import { CategoryModel } from '../../models/category.model';
import { CategoriesService } from '../../services/categories.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent {
  readonly categories$: Observable<CategoryModel[]> = this._categoriesService
    .getAll()
    .pipe(tap((categories) => this.addControlsToCategoriesForm(categories)));
  readonly categoriesForm: FormGroup = new FormGroup({});
  readonly categoriesFormValue$: Observable<string[]> =
    this.categoriesForm.valueChanges.pipe(
      tap(console.log),
      map((form) => Object.keys(form).filter((k) => form[k] === true))
    );

  constructor(private _categoriesService: CategoriesService) {}

  addControlsToCategoriesForm(categories: CategoryModel[]): void {
    categories.forEach((c) => {
      this.categoriesForm.addControl(c.id, new FormControl(false));
    });
  }
}
