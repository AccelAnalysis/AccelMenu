import { useMemo, useState } from 'react';
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

  return (
    <header className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
      <div>
        <p className="text-xs uppercase text-gray-500">Board</p>
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        {subtitle ? <p className="text-sm text-gray-600">{subtitle}</p> : null}
      </div>
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
    </header>
  );
}

export default BoardHeader;
