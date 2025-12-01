import React, { useCallback, useMemo, useState } from 'react';
import { useStorage } from '../../api/storage';
import { useEditor } from '../../state/editorSlice';
import type { EditorAsset } from '../../types/editor';

export function AssetBar() {
  const { uploadAsset, mapFileToAsset, uploads } = useStorage();
  const { addAsset, addLayer, assets, activeSlideId } = useEditor();
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;

      for (const file of Array.from(files)) {
        const url = await uploadAsset(file);
        const asset = mapFileToAsset(file, url);
        addAsset(asset);

        if (file.type.startsWith('image/') && activeSlideId) {
          addLayer({
            type: 'image',
            name: file.name,
            assetUrl: url,
            transform: { x: 60, y: 60, width: 240, height: 180 },
            opacity: 1,
          });
        }
      }
    },
    [activeSlideId, addAsset, addLayer, mapFileToAsset, uploadAsset]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const renderUploadStatus = useMemo(() => {
    if (!uploads.length) return null;
    return (
      <div className="mt-3 space-y-1 text-xs text-gray-600">
        {uploads.map((upload) => (
          <div key={upload.assetName} className="flex items-center gap-2">
            <span className="w-32 truncate font-medium">{upload.assetName}</span>
            <div className="h-2 flex-1 rounded bg-gray-100">
              <div className="h-2 rounded bg-blue-500" style={{ width: `${upload.progress}%` }} />
            </div>
            <span className="w-12 text-right text-[10px] font-semibold">{Math.round(upload.progress)}%</span>
          </div>
        ))}
      </div>
    );
  }, [uploads]);

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Assets</h3>
          <p className="text-xs text-gray-500">Drop files to upload and add them to your slide.</p>
        </div>
        <label className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">
          <input type="file" className="hidden" onChange={(event) => handleFiles(event.target.files)} multiple />
          Upload
        </label>
      </div>

      <div
        className={`flex min-h-[140px] flex-col items-center justify-center rounded border-2 border-dashed p-4 text-center text-sm transition ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <p className="font-semibold text-gray-800">Drag & Drop assets here</p>
        <p className="text-xs text-gray-500">Images are automatically added to the canvas.</p>
      </div>

      {renderUploadStatus}

      <div className="grid grid-cols-3 gap-2 overflow-y-auto">
        {assets.length === 0 ? (
          <p className="col-span-3 rounded bg-gray-50 px-3 py-2 text-xs text-gray-600">No assets uploaded yet.</p>
        ) : (
          assets.map((asset: EditorAsset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() =>
                addLayer({
                  type: 'image',
                  name: asset.name,
                  assetUrl: asset.url,
                  transform: { x: 80, y: 80, width: 200, height: 160 },
                  opacity: 1,
                })
              }
              className="group flex flex-col items-center gap-2 rounded border border-gray-200 p-2 text-xs text-gray-700 shadow-sm transition hover:border-blue-400"
            >
              <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded bg-gray-50">
                {asset.type.startsWith('image/') ? (
                  <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-semibold text-gray-500">{asset.type}</span>
                )}
              </div>
              <span className="w-full truncate text-center text-[11px] font-semibold">{asset.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default AssetBar;
