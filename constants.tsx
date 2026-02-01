
import React from 'react';
import { Product, Category, Banner, Order } from './types';

export const COLORS = {
  primary: '#ff4400', 
  secondary: '#333333',
  background: '#f5f5f5',
  white: '#ffffff',
  text: {
    main: '#333333',
    light: '#999999',
    price: '#000000' // Kikuu style price is black
  },
  accent: '#2ecc71', 
  info: '#3498db',    
  ali: {
    price: '#9c27b0', 
    gradient: 'linear-gradient(90deg, #9c27b0 0%, #e91e63 100%)',
    badgeText: '#ffffff'
  }
};

export const MOCK_ORDERS: Order[] = [
  { id: '10245', customer: 'Hamis J.', total: 45000, status: 'completed', date: '2025-05-10' },
  { id: '10246', customer: 'Neema A.', total: 12500, status: 'processing', date: '2025-05-11' },
  { id: '10247', customer: 'John K.', total: 89000, status: 'canceled', date: '2025-05-11' },
];

export const BANNERS: Banner[] = [
  { id: '1', image: 'https://picsum.photos/seed/sonko1/800/400', link: '#' },
  { id: '2', image: 'https://picsum.photos/seed/sonko2/800/400', link: '#' },
  { id: '3', image: 'https://picsum.photos/seed/sonko3/800/400', link: '#' },
];

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Mobiles', icon: '📱' },
  { id: '2', name: 'Spika', icon: '🔊' },
  { id: '3', name: 'Mic', icon: '🎤' },
  { id: '4', name: 'Subwoofer', icon: '📻' },
  { id: '5', name: 'Fridge', icon: '🧊' },
  { id: '6', name: 'TV', icon: '📺' },
  { id: '7', name: 'Mobile accessories', icon: '🎧' },
  { id: '8', name: 'TV accessories', icon: '🔌' },
  { id: '9', name: 'Guitars', icon: '🎸' },
  { id: '10', name: 'Keyboards', icon: '🎹' },
  { id: '11', name: 'Drums', icon: '🥁' },
  { id: '12', name: 'Mixers', icon: '🎚️' },
  { id: '13', name: 'Spares', icon: '⚙️' },
  { id: '14', name: 'Bidhaa Zote', icon: '📦' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'New Fashion Men\'s Casual Sneakers Breathable Running Shoes',
    image: 'https://picsum.photos/seed/p1/400/500', // Vertical
    price: 35000,
    discount: 10,
    orderCount: '1,245 orders',
    rating: 4.8,
    category: 'Bidhaa Zote',
    status: 'online'
  },
  {
    id: 'p2',
    title: 'Professional Bluetooth Wireless Earbuds Noise Cancelling',
    image: 'https://picsum.photos/seed/p2/400/400', // Square
    price: 15298,
    discount: 17,
    orderCount: '840 orders',
    rating: 4.2,
    category: 'Mobile accessories',
    status: 'online'
  },
  {
    id: 'p3',
    title: 'Women\'s Elegant Summer Dress Floral Print Chiffon',
    image: 'https://picsum.photos/seed/p3/400/600', // Long Vertical
    price: 28000,
    discount: 5,
    orderCount: '402 orders',
    rating: 4.5,
    category: 'Bidhaa Zote',
    status: 'pending'
  },
  {
    id: 'p4',
    title: '4K Ultra HD Smart Android TV Box',
    image: 'https://picsum.photos/seed/p4/400/350', // Wide-ish
    price: 85000,
    discount: 25,
    orderCount: '2k+ orders',
    rating: 4.9,
    category: 'TV accessories',
    status: 'online'
  },
  {
    id: 'p5',
    title: 'Multifunctional Waterproof Sports Watch for Men',
    image: 'https://picsum.photos/seed/p5/400/550', // Vertical
    price: 12500,
    discount: 30,
    orderCount: '5k+ orders',
    rating: 4.7,
    category: 'Bidhaa Zote',
    status: 'out-of-stock'
  },
  {
    id: 'p6',
    title: 'Stainless Steel Portable Vacuum Insulated Water Bottle',
    image: 'https://picsum.photos/seed/p6/400/400', // Square
    price: 18000,
    orderCount: '300 orders',
    rating: 4.0,
    category: 'Bidhaa Zote',
    status: 'online'
  }
];

export const ICONS = {
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Cart: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  ),
  Products: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  User: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Home: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  List: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  ),
  Heart: ({ fill = "none" }: { fill?: string }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  )
};
