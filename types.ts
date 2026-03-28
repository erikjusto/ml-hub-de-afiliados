
export interface ProductData {
  name: string;
  price: string;
  currency: string;
  installmentInfo: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
}

export interface ImportRecord extends ProductData {
  id: string;
  importedAt: string;
  status: 'published' | 'draft';
}

export interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export enum AppTab {
  IMPORTER = 'importer',
  EXPLORER = 'explorer',
  HISTORY = 'history',
  SETTINGS = 'settings'
}

export interface MLCategory {
  id: string;
  name: string;
}

export interface MLProduct {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  thumbnail: string;
  permalink: string;
  condition: string;
}
