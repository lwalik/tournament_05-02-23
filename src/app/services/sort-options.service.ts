import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SortFormModel } from '../models/sort-form.model';

@Injectable({ providedIn: 'root' })
export class SortOptionsService {
  getAll(): Observable<Record<string, SortFormModel>> {
    return of({
      Featured: { order: 'desc', sortBy: 'featureValue' },
      'Price: Low to High': { order: 'asc', sortBy: 'price' },
      'Price: High to Low': { order: 'desc', sortBy: 'price' },
      'Avg. Rating': { order: 'desc', sortBy: 'ratingValue' },
    });
  }
}
