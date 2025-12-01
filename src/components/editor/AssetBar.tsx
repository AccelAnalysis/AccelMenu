import React, { useCallback, useRef, useState } from 'react';
import { useStorage } from '../../api/storage';
import { useEditorStore } from '../../state/editorSlice';

export function AssetBar() {
  const { uploadAsset, uploading, isConfigured } = useStorage();
  const { registerAsset, addLayer, activeSlide } = useEditorStore();
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        try {
          const result = await uploadAsset(file);
          const asset = {
            id: result.path,
            name: file.name,
            url: result.url,
            type: file.type,
            size: file.size,
            uploadedAt: Date.now(),
          };
          registerAsset(asset);
          if (activeSlide) {
            addLayer({
              type: 'image',
              name: file.name,
              assetUrl: result.url,
              style: { fill: '#ffffff' },
            });
          }
          setMessage(`Uploaded ${file.name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          setMessage(errorMessage);
        }
      }
    },
    [activeSlide, addLayer, registerAsset, uploadAsset]
  );

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files?.length) {
      void handleFiles(event.dataTransfer.files);
    }
  };

  const handleBrowse = () => inputRef.current?.click();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">Assets</p>
          <p className="text-xs text-gray-500">Drop images to upload and add to the canvas.</p>
        </div>
        <button
          type="button"
          className="rounded bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
          onClick={handleBrowse}
          disabled={!isConfigured}
        >
          Browse
        </button>
      </div>

      {!isConfigured ? (
        <p className="text-sm text-amber-700">
          Storage is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable uploads.
        </p>
      ) : null}

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600"
      >
        <p>{uploading ? 'Uploading…' : 'Drop assets here or browse files.'}</p>
        <p className="text-xs text-gray-500">Images will be added to the current slide as layers.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          multiple
          onChange={(event) => event.target.files && void handleFiles(event.target.files)}
        />
      </div>

      {message ? <p className="text-xs text-gray-600">{message}</p> : null}
    </div>
  );
}

export default AssetBar;
