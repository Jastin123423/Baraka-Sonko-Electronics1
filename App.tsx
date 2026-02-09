// In your types.ts file or at the top of ProductDetailView.tsx
interface Comment {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userInitials: string;
  userColor: string;
  textColor: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

// Update ProductDetailViewProps interface
interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onProductClick: (product: Product) => void;
  WatermarkedImage: React.ComponentType<any>;
  VideoPlayer?: React.ComponentType<any>;
  Banner?: React.ComponentType<any>;
  onWhatsAppClick?: () => void;
  onCallClick?: () => void;
  // New comments props
  comments?: Comment[];
  commentCount?: number;
  onFetchComments?: () => void;
  onAddComment?: (content: string) => Promise<Comment | null>;
  onLikeComment?: (commentId: string) => Promise<boolean>;
  onDeleteComment?: (commentId: string) => Promise<boolean>;
  isLoadingComments?: boolean;
}
