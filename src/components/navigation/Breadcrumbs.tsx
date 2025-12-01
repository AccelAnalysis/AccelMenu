import Link from 'next/link';
import { buildBoardUrl, buildLocationUrl, buildSlideUrl } from '../../utils/urls';

interface BreadcrumbProps {
  locationSlug: string;
  locationName: string;
  boardSlug?: string;
  boardName?: string;
  slideSlug?: string;
  slideTitle?: string;
}

export function Breadcrumbs({
  locationSlug,
  locationName,
  boardSlug,
  boardName,
  slideSlug,
  slideTitle,
}: BreadcrumbProps) {
  const locationHref = buildLocationUrl(locationSlug);
  const boardHref = boardSlug
    ? buildBoardUrl(locationSlug, boardSlug)
    : undefined;
  const slideHref = slideSlug && boardSlug
    ? buildSlideUrl(locationSlug, boardSlug, slideSlug)
    : undefined;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            href={locationHref}
            className="text-indigo-600 hover:text-indigo-800"
          >
            {locationName}
          </Link>
        </li>
        {boardHref && boardName ? (
          <li className="flex items-center gap-2">
            <span className="text-gray-400">/</span>
            <Link
              href={boardHref}
              className={
                slideHref
                  ? 'text-indigo-600 hover:text-indigo-800'
                  : 'font-semibold text-gray-900'
              }
            >
              {boardName}
            </Link>
          </li>
        ) : null}
        {slideHref && slideTitle ? (
          <li className="flex items-center gap-2">
            <span className="text-gray-400">/</span>
            <Link href={slideHref} className="font-semibold text-gray-900">
              {slideTitle}
            </Link>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
