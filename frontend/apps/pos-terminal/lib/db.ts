import Dexie, { type EntityTable } from 'dexie';

interface OfflineOrder {
  id: string; // UUIDv7
  totalAmount: number;
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  lineItems: { productId: string; quantity: number; unitPrice: number }[];
  createdAt: string;
}

interface ProductCache {
  id: string;
  name: string;
  sku: string;
  price: number;
  barcode: string;
}

const db = new Dexie('pos-terminal-db') as Dexie & {
  offlineOrders: EntityTable<OfflineOrder, 'id'>;
  products: EntityTable<ProductCache, 'id'>;
};

db.version(1).stores({
  offlineOrders: 'id, status, createdAt',
  products: 'id, sku, barcode'
});

export { db, type OfflineOrder, type ProductCache };
