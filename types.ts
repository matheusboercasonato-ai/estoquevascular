
export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT'
}

export interface Category {
  id: string;
  name: string;
  color: string;
  emoji?: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
  categoryId: string;
  costPrice: number;
  locationId: string;
  expirationDate: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  date: string;
  reason: string;
  unitPrice: number;
}

export interface InventoryState {
  products: Product[];
  categories: Category[];
  locations: Location[];
  transactions: Transaction[];
}
