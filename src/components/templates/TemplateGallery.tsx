import { useEffect, useMemo, useState } from 'react';
import { listTemplates } from '../../api/client';
import type { Template } from '../../api/models';

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
  onApply: (template: Template) => void;
  activeTemplateId?: string;
}

export function TemplateGallery({ open, onClose, onApply, activeTemplateId }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);

    listTemplates()
      .then((items) => setTemplates(items))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [open]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === activeTemplateId),
    [templates, activeTemplateId]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-gray-200 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Templates</p>
            <h2 className="text-xl font-semibold text-gray-900">Choose a template</h2>
            <p className="text-sm text-gray-600">
              Apply a starting layout to your slide. Content can be edited after applying.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </header>

        <div className="p-4">
          {loading ? (
            <p className="text-sm text-gray-600">Loading templates…</p>
          ) : error ? (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-gray-600">No templates available yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {templates.map((template) => {
                const isActive = template.id === selectedTemplate?.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onApply(template)}
                    className={`flex flex-col rounded-lg border p-3 text-left shadow-sm transition hover:border-blue-400 hover:shadow ${
                      isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="aspect-video w-full overflow-hidden rounded bg-gray-50">
                      {template.previewUrl ? (
                        <img
                          src={template.previewUrl}
                          alt={template.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                          No preview
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                      {template.description ? (
                        <p className="text-xs text-gray-600">{template.description}</p>
                      ) : null}
                      <span className="mt-2 inline-flex w-fit items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        Layout: {template.layout}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplateGallery;
