export interface Product {
  id: string;
  title: string;
  price: string;
  price_numeric: number;
  link: string;
  source: string;
  thumbnail: string;
  rating?: number;
  reviews?: number;
  delivery?: string;
  old_price?: number;
  model_number?: string;
  dimensions?: string;
  specifications?: Record<string, string>;
  user_reviews?: Review[];
}

export interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PricePoint {
  date: string;
  price: number;
}
