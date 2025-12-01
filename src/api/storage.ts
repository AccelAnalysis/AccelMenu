import { useCallback, useState } from 'react';
import type { EditorAsset } from '../types/editor';

export interface UploadProgress {
  assetName: string;
  progress: number;
}

export function useStorage() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const uploadAsset = useCallback(async (file: File): Promise<string> => {
    const id = `${file.name}-${Date.now()}`;
    setUploads((prev) => [...prev, { assetName: file.name, progress: 0 }]);

    const url = URL.createObjectURL(file);

    await new Promise<void>((resolve) => {
      const steps = 5;
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        setUploads((prev) =>
          prev.map((item) =>
            item.assetName === file.name
              ? { ...item, progress: Math.min(100, (current / steps) * 100) }
              : item
          )
        );
        if (current >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, 80);
    });

    setUploads((prev) => prev.filter((item) => item.assetName !== file.name));
    return url || id;
  }, []);

  const mapFileToAsset = useCallback((file: File, url: string): EditorAsset => {
    return {
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      url,
      type: file.type,
      size: file.size,
    };
  }, []);

  return { uploadAsset, uploads, mapFileToAsset };
}
