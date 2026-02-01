
import { Category } from '../../types';

// Define Cloudflare D1 types to resolve "Cannot find name" and "Untyped function calls" errors
interface D1PreparedStatement {
  all<T = any>(): Promise<{ results: T[] }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// Define PagesFunction to resolve "Cannot find name" error
type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
}) => Promise<Response> | Response;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    // Fix: D1Database all() call now accepts type arguments via defined interface
    const { results } = await env.DB.prepare("SELECT * FROM categories ORDER BY name ASC").all<Category>();
    return Response.json({ success: true, data: results });
  } catch (e: any) {
    // If table doesn't exist, return default mock categories as fallback for initialization
    const mock = [
      { id: '1', name: 'Mobiles', icon: '📱' },
      { id: '2', name: 'Spika', icon: '🔊' },
      { id: '3', name: 'Mic', icon: '🎤' },
      { id: '4', name: 'Subwoofer', icon: '📻' },
      { id: '5', name: 'Bidhaa Zote', icon: '📦' }
    ];
    return Response.json({ success: true, data: mock });
  }
};
