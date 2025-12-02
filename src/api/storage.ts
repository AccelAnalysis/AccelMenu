import { useCallback, useState } from 'react';
import type { EditorAsset } from '../types/editor';
import { cacheAssetMetadataFromFile } from '../utils/storage/indexedDb';
import { processImage } from '../utils/image/processor';

export interface UploadProgress {
  assetName: string;
  progress: number;
}

export function useStorage() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const uploadAsset = useCallback(async (
    file: File
  ): Promise<{ url: string; file: File; id: string }> => {
    const id = `${file.name}-${Date.now()}`;
    setUploads((prev) => [...prev, { assetName: file.name, progress: 0 }]);

    const processedFile = await processImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
    });

    const url = URL.createObjectURL(processedFile);

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

    cacheAssetMetadataFromFile(file, processedFile, id).catch(() => undefined);

    return { url: url || id, file: processedFile, id };
  }, []);

  const mapFileToAsset = useCallback((file: File, url: string, id?: string): EditorAsset => {
    return {
      id: id ?? `${file.name}-${Date.now()}`,
      name: file.name,
      url,
      type: file.type,
      size: file.size,
    };
  }, []);

  return { uploadAsset, uploads, mapFileToAsset };
}
