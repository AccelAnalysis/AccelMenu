import { useEffect, useState } from 'react';
import { listVersions, restoreVersion } from '../../api/client';
import type { Slide, SlideVersion } from '../../api/models';

interface VersionTimelineProps {
  slideId?: string;
  onRestore?: (slide: Slide) => void;
}

export function VersionTimeline({ slideId, onRestore }: VersionTimelineProps) {
  const [versions, setVersions] = useState<SlideVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slideId) {
      setVersions([]);
      return;
    }

    setLoading(true);
    setError(null);
    listVersions(slideId)
      .then((items) => setVersions(items))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [slideId]);

  const handleRestore = async (version: SlideVersion) => {
    if (!slideId) return;
    setRestoringId(version.id);
    setError(null);

    try {
      const slide = await restoreVersion(slideId, version.id);
      onRestore?.(slide);
      const updatedVersions = await listVersions(slideId);
      setVersions(updatedVersions);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 p-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">History</p>
          <h3 className="text-base font-semibold text-gray-900">Version timeline</h3>
        </div>
        <span className="text-xs text-gray-500">{versions.length} versions</span>
      </header>

      <div className="p-3">
        {loading ? (
          <p className="text-sm text-gray-600">Loading versions…</p>
        ) : error ? (
          <p className="text-sm font-semibold text-red-600">{error}</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-gray-600">No history available.</p>
        ) : (
          <ul className="space-y-3">
            {versions.map((version) => (
              <li key={version.id} className="flex items-center justify-between rounded border border-gray-100 p-3 shadow-sm">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{version.label}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(version.createdAt).toLocaleString()} {version.author ? `• ${version.author}` : ''}
                  </p>
                  {version.summary ? (
                    <p className="text-xs text-gray-600">{version.summary}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  disabled={restoringId === version.id}
                  onClick={() => handleRestore(version)}
                >
                  {restoringId === version.id ? 'Restoring…' : 'Restore'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default VersionTimeline;
