export const uploadToR2 = async (file: File) => {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.success) throw new Error(data?.error || 'Upload failed');
  return data.url as string;
};
