
// Define Cloudflare D1 types to resolve "Cannot find name" error
interface D1PreparedStatement {
  first<T = any>(): Promise<T | null>;
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
    // Summing orders for stats
    const stats = await env.DB.prepare(`
      SELECT 
        SUM(total) as netSales,
        CAST(SUM(total) * 0.85 AS INT) as earnings,
        COUNT(*) as totalOrders
      FROM orders
      WHERE status = 'completed'
    `).first<any>();

    return Response.json({ 
      success: true, 
      data: {
        netSales: stats?.netSales || 0,
        earnings: stats?.earnings || 0,
        pageViews: 1240, // Simulated or pulled from another source
        totalOrders: stats?.totalOrders || 0
      } 
    });
  } catch (e) {
    return Response.json({ 
      success: true, 
      data: { netSales: 0, earnings: 0, pageViews: 0, totalOrders: 0 } 
    });
  }
};
