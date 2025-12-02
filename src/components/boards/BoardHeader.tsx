import { useMemo, useState } from 'react';
import { cacheSlides, publishBoard, revertBoard } from '../../api/client';
import { useBoardsStore } from '../../store/boards';
import { buildBoardUrl } from '../../utils/urls';

interface BoardHeaderProps {
  name: string;
  boardSlug: string;
  locationSlug: string;
  subtitle?: string;
}

export function BoardHeader({
  name,
  boardSlug,
  locationSlug,
  subtitle,
}: BoardHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { slidesByBoard, setBoardSlides } = useBoardsStore();
  const slides = slidesByBoard[boardSlug] ?? [];
  const publishedCount = useMemo(
    () => slides.filter((slide) => slide.status === 'published').length,
    [slides]
  );
  const boardUrl = useMemo(
    () => buildBoardUrl(locationSlug, boardSlug),
    [locationSlug, boardSlug]
  );

  const handleCopy = async () => {
    const fullUrl = `${window.location.origin}${boardUrl}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Unable to copy board link', error);
    }
  };

  const handlePublishAll = async () => {
    if (!locationSlug) {
      setError('Missing location context for publishing.');
      return;
    }

    setPublishing(true);
    setError(null);
    try {
      cacheSlides(locationSlug, boardSlug, slides);
      const updatedSlides = await publishBoard(locationSlug, boardSlug);
      setBoardSlides(boardSlug, updatedSlides);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const handleRevert = async () => {
    if (!locationSlug) {
      setError('Missing location context for publishing.');
      return;
    }

    setReverting(true);
    setError(null);
    try {
      cacheSlides(locationSlug, boardSlug, slides);
      const updatedSlides = await revertBoard(locationSlug, boardSlug);
      setBoardSlides(boardSlug, updatedSlides);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReverting(false);
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
      <div>
        <p className="text-xs uppercase text-gray-500">Board</p>
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        {subtitle ? <p className="text-sm text-gray-600">{subtitle}</p> : null}
      </div>
      <div className="flex flex-col items-end gap-2 text-right">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{boardUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="text-right">
            <p className="text-[11px] uppercase text-gray-500">Publish state</p>
            <p className="text-sm font-semibold text-gray-900">
              {publishedCount} / {slides.length} slides live
            </p>
          </div>
          <button
            type="button"
            onClick={handlePublishAll}
            disabled={publishing || slides.length === 0}
            className="rounded bg-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
          >
            {publishing ? 'Publishing…' : 'Publish all'}
          </button>
          <button
            type="button"
            onClick={handleRevert}
            disabled={reverting || slides.length === 0}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            {reverting ? 'Reverting…' : 'Revert to draft'}
          </button>
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </header>
  );
}

export default BoardHeader;
