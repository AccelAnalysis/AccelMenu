import { useCallback, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface StorageUploadResult {
  path: string;
  url: string;
}

function createStorageClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function useStorage(bucket = 'assets') {
  const client = useMemo(() => createStorageClient(), []);
  const [uploading, setUploading] = useState(false);

  const uploadAsset = useCallback(
    async (file: File): Promise<StorageUploadResult> => {
      if (!client) {
        throw new Error('Storage is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      }
      setUploading(true);
      try {
        const path = `${Date.now()}-${file.name}`;
        const { data, error } = await client.storage.from(bucket).upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });
        if (error || !data) {
          throw error ?? new Error('Upload failed');
        }
        const { data: publicUrl } = client.storage.from(bucket).getPublicUrl(data.path);
        return { path: data.path, url: publicUrl?.publicUrl ?? '' };
      } finally {
        setUploading(false);
      }
    },
    [bucket, client]
  );

  return {
    uploadAsset,
    uploading,
    isConfigured: Boolean(client),
  };
}
