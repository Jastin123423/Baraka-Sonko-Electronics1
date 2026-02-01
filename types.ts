
export interface Product {
  id: string;
  title: string;
  image: string; // Featured image (URL)
  images?: string[]; // Gallery slider images (URLs)
  descriptionImages?: string[]; // Images shown below description (URLs)
  videoUrl?: string; // Product video (URL)
  price: number;
  originalPrice?: number;
  discount?: number;
  soldCount?: string;
  orderCount?: string; 
  rating?: number; 
  category?: string;
  status?: 'online' | 'pending' | 'out-of-stock';
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Banner {
  id: string;
  image: string;
  link: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'customer';
}

export interface Order {
  id: string;
  customer: string;
  total: number;
  status: 'processing' | 'completed' | 'canceled';
  date: string;
}

export interface AdminStats {
  netSales: number;
  earnings: number;
  pageViews: number;
  totalOrders: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
