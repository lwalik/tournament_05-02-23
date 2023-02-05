export interface ProductModel {
  readonly id: string;
  readonly name: string;
  readonly featureValue: number;
  readonly imageUrl: string;
  readonly price: number;
  readonly ratingCount: number;
  readonly ratingValue: number;
  readonly categoryId: string;
  readonly storeIds: string[];
}
