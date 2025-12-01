import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  cacheSlides,
  getBoardsForLocation,
  getSlidesForBoard,
  getCachedSlides,
} from '../api/client';
import { MenuBoard, Slide } from '../api/models';

interface UseBoardsState {
  boards: MenuBoard[];
  slidesByBoard: Record<string, Slide[]>;
  loading: boolean;
  error: Error | null;
}

export function useBoards(locationSlug?: string, boardSlug?: string) {
  const [state, setState] = useState<UseBoardsState>({
    boards: [],
    slidesByBoard: {},
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!locationSlug) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));
    let cancelled = false;

    getBoardsForLocation(locationSlug)
      .then((boards) => {
        if (cancelled) return;
        const hydratedSlides = boards.reduce<Record<string, Slide[]>>((acc, board) => {
          if (board.slides && board.slides.length > 0) {
            cacheSlides(locationSlug, board.boardSlug, board.slides);
            acc[board.boardSlug] = board.slides;
          }
          return acc;
        }, {});

        setState((prev) => ({
          ...prev,
          boards,
          slidesByBoard: {
            ...prev.slidesByBoard,
            ...hydratedSlides,
          },
          loading: false,
        }));
      })
      .catch((error) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, error, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [locationSlug]);

  useEffect(() => {
    if (!locationSlug || !boardSlug) return;

    const cachedSlides = getCachedSlides(locationSlug, boardSlug);
    if (cachedSlides) {
      setState((prev) => ({
        ...prev,
        slidesByBoard: {
          ...prev.slidesByBoard,
          [boardSlug]: cachedSlides,
        },
      }));
      return;
    }

    let cancelled = false;
    getSlidesForBoard(locationSlug, boardSlug)
      .then((slides) => {
        if (cancelled) return;
        cacheSlides(locationSlug, boardSlug, slides);
        setState((prev) => ({
          ...prev,
          slidesByBoard: {
            ...prev.slidesByBoard,
            [boardSlug]: slides,
          },
        }));
      })
      .catch((error) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, error }));
      });

    return () => {
      cancelled = true;
    };
  }, [locationSlug, boardSlug]);

  const getSlides = useCallback(
    (boardSlugToLookup: string): Slide[] | undefined => {
      if (!locationSlug) return undefined;
      return (
        state.slidesByBoard[boardSlugToLookup] ??
        getCachedSlides(locationSlug, boardSlugToLookup)
      );
    },
    [locationSlug, state.slidesByBoard]
  );

  const hydrateSlides = useCallback(
    (boardSlugToHydrate: string, slides: Slide[]) => {
      if (!locationSlug) return;
      cacheSlides(locationSlug, boardSlugToHydrate, slides);
      setState((prev) => ({
        ...prev,
        slidesByBoard: {
          ...prev.slidesByBoard,
          [boardSlugToHydrate]: slides,
        },
      }));
    },
    [locationSlug]
  );

  const value = useMemo(
    () => ({
      boards: state.boards,
      slidesByBoard: state.slidesByBoard,
      loading: state.loading,
      error: state.error,
      getSlides,
      hydrateSlides,
    }),
    [state, getSlides, hydrateSlides]
  );

  return value;
}
