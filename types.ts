export interface Product {
  id: string;
  title: string;
  image: string; // Featured image (URL)
  images?: string[]; // Gallery slider images (URLs)
  descriptionImages?: string[]; // Images shown below description (URLs)
  videoUrl?: string; // Product video (URL)
  price: number; // Selling price (what customer pays)
  originalPrice: number; // REQUIRED: Original price before discount
  sellingPrice?: number; // Optional: Same as price for consistency
  discount?: number; // Auto-calculated discount percentage
  discountAmount?: number; // Discount amount in TSh
  soldCount?: string;
  orderCount?: string; 
  rating?: number; 
  category: string; // REQUIRED: Changed from optional to required
  categoryName?: string; // Alternative field name for backend compatibility
  status?: 'online' | 'pending' | 'out-of-stock';
  views: number; // REQUIRED: View counter starting at 0
  viewCount?: number; // Alternative field name for backend compatibility
  createdAt?: string;
  created_at?: string; // Alternative field name for backend compatibility
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
  totalProducts?: number; // Added for dashboard display
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
