import { useMemo, useState } from 'react';
import { buildLocationUrl } from '../../utils/urls';

interface LocationHeaderProps {
  name: string;
  slug: string;
  subtitle?: string;
}

export function LocationHeader({ name, slug, subtitle }: LocationHeaderProps) {
  const [copied, setCopied] = useState(false);
  const locationUrl = useMemo(() => buildLocationUrl(slug), [slug]);

  const handleCopy = async () => {
    const fullUrl = `${window.location.origin}${locationUrl}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Unable to copy location link', error);
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
      <div>
        <p className="text-xs uppercase text-gray-500">Location</p>
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        {subtitle ? <p className="text-sm text-gray-600">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{locationUrl}</span>
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

export default LocationHeader;
