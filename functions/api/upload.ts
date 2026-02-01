
// Define Cloudflare R2 types to resolve "Cannot find name" error
interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: any): Promise<any>;
}

// Define PagesFunction to resolve "Cannot find name" error
type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
}) => Promise<Response> | Response;

interface Env {
  BUCKET: R2Bucket;
  R2_PUBLIC_URL: string; // The public URL for the bucket (e.g. pub-123.r2.dev)
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const urls: string[] = [];

    for (const file of files) {
      const extension = file.name.split('.').pop();
      const filename = `${crypto.randomUUID()}.${extension}`;
      
      await env.BUCKET.put(filename, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      // Construct the public URL
      urls.push(`${env.R2_PUBLIC_URL}/${filename}`);
    }

    return Response.json({ success: true, data: urls });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
};
