
import { Product } from '../../types';

// Define Cloudflare D1 types to resolve "Cannot find name" and "Untyped function calls" errors
interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = any>(): Promise<{ results: T[] }>;
  run(): Promise<any>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// Define PagesFunction to resolve "Cannot find name" error
type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => Promise<Response> | Response;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const { method } = request;
  const url = new URL(request.url);

  // GET: Fetch all products or a single product
  if (method === 'GET') {
    try {
      const id = url.searchParams.get('id');
      const category = url.searchParams.get('category');
      
      let query = "SELECT * FROM products ORDER BY createdAt DESC";
      let params: any[] = [];
      
      if (id) {
        query = "SELECT * FROM products WHERE id = ?";
        params = [id];
      } else if (category) {
        query = "SELECT * FROM products WHERE category = ? ORDER BY createdAt DESC";
        params = [category];
      }

      // Fix: D1Database all() call now accepts type arguments via defined interface
      const { results } = await env.DB.prepare(query).bind(...params).all<Product>();
      
      // Post-processing for JSON strings (images)
      const data = results.map(p => ({
        ...p,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
        descriptionImages: typeof p.descriptionImages === 'string' ? JSON.parse(p.descriptionImages) : p.descriptionImages,
      }));

      return Response.json({ success: true, data });
    } catch (e: any) {
      return Response.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  // POST: Create or Update a product
  if (method === 'POST') {
    try {
      const body: Product = await request.json();
      const id = crypto.randomUUID();
      
      await env.DB.prepare(`
        INSERT INTO products (id, title, image, images, descriptionImages, videoUrl, price, originalPrice, discount, category, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id, 
        body.title, 
        body.image, 
        JSON.stringify(body.images || []), 
        JSON.stringify(body.descriptionImages || []), 
        body.videoUrl || null,
        body.price,
        body.originalPrice || null,
        body.discount || null,
        body.category,
        body.status || 'online'
      ).run();

      return Response.json({ success: true, data: { ...body, id } });
    } catch (e: any) {
      return Response.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  // DELETE: Remove a product
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ success: false, error: "Missing ID" }, { status: 400 });

    try {
      await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    } catch (e: any) {
      return Response.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
