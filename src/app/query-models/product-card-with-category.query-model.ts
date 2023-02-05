export interface ProductCardWithCategoryQueryModel {
  readonly id: string;
  readonly name: string;
  readonly featureValue: number;
  readonly imageUrl: string;
  readonly price: number;
  readonly ratingValue: number;
  readonly ratingCount: number;
  readonly ratingOptions: number[];
  readonly categoryName: string;
  readonly storeIds: string[];
}
