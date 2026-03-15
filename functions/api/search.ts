// /api/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;
  
  if (!q || typeof q !== 'string' || q.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  try {
    // Fetch from your actual products API
    const response = await fetch(`https://barakasonko.store/api/products/search?q=${encodeURIComponent(q)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    
    // Format the response
    const suggestions = [
      // Map products to suggestions
      ...(data.products || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        type: 'product',
        image: product.image,
        price: product.price
      })),
      // You can also include category suggestions if your API supports it
    ];

    res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
}
