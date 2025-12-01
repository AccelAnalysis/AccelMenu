import Link from 'next/link';
import { buildBoardUrl, buildLocationUrl } from '../../utils/urls';

export interface SidebarBoard {
  name: string;
  slug: string;
}

export interface SidebarLocation {
  name: string;
  slug: string;
  boards?: SidebarBoard[];
}

interface NavigationSidebarProps {
  locations: SidebarLocation[];
  activeLocationSlug?: string;
  activeBoardSlug?: string;
}

export function NavigationSidebar({
  locations,
  activeLocationSlug,
  activeBoardSlug,
}: NavigationSidebarProps) {
  return (
    <aside className="w-64 border-r border-gray-200 bg-white">
      <div className="p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Locations
        </h2>
      </div>
      <nav className="space-y-2 p-2">
        {locations.map((location) => {
          const isActiveLocation = location.slug === activeLocationSlug;
          return (
            <div key={location.slug} className="rounded-lg">
              <Link
                href={buildLocationUrl(location.slug)}
                className={`flex items-center justify-between rounded px-3 py-2 text-sm font-medium transition hover:bg-gray-50 ${
                  isActiveLocation
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-800'
                }`}
              >
                <span>{location.name}</span>
                <span className="text-xs text-gray-500">/{location.slug}</span>
              </Link>
              {location.boards && location.boards.length > 0 ? (
                <ul className="mt-1 space-y-1 border-l border-gray-200 pl-4">
                  {location.boards.map((board) => {
                    const isActiveBoard =
                      isActiveLocation && board.slug === activeBoardSlug;
                    return (
                      <li key={board.slug}>
                        <Link
                          href={buildBoardUrl(location.slug, board.slug)}
                          className={`flex items-center justify-between rounded px-3 py-1.5 text-sm transition hover:bg-gray-50 ${
                            isActiveBoard
                              ? 'bg-indigo-50 font-semibold text-indigo-700'
                              : 'text-gray-700'
                          }`}
                        >
                          <span>{board.name}</span>
                          <span className="text-xs text-gray-400">/{board.slug}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default NavigationSidebar;
