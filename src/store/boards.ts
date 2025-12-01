import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { Slide } from '../api/models';

type SlidesByBoard = Record<string, Slide[]>;

type BoardsAction =
  | { type: 'reorder'; boardSlug: string; activeId: string; overId: string }
  | { type: 'insert'; boardSlug: string; slide: Slide; index?: number }
  | { type: 'remove'; boardSlug: string; slideId: string }
  | { type: 'update'; boardSlug: string; slideId: string; updates: Partial<Slide> };

interface BoardsState {
  slidesByBoard: SlidesByBoard;
  maxSlides: number;
}

interface BoardsContextValue extends BoardsState {
  reorderSlides: (boardSlug: string, activeId: string, overId: string) => void;
  insertSlide: (boardSlug: string, slide: Slide, index?: number) => void;
  removeSlide: (boardSlug: string, slideId: string) => void;
  updateSlide: (boardSlug: string, slideId: string, updates: Partial<Slide>) => void;
}

const DEFAULT_MAX_SLIDES = 50;

const BoardsContext = createContext<BoardsContextValue | undefined>(undefined);

function boardsReducer(state: BoardsState, action: BoardsAction): BoardsState {
  switch (action.type) {
    case 'reorder': {
      const { boardSlug, activeId, overId } = action;
      const slides = state.slidesByBoard[boardSlug] ?? [];
      const oldIndex = slides.findIndex((slide) => slide.id === activeId);
      const newIndex = slides.findIndex((slide) => slide.id === overId);

      if (oldIndex === -1 || newIndex === -1) return state;

      const updated = [...slides];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);

      return {
        ...state,
        slidesByBoard: {
          ...state.slidesByBoard,
          [boardSlug]: updated,
        },
      };
    }
    case 'insert': {
      const { boardSlug, slide, index } = action;
      const slides = state.slidesByBoard[boardSlug] ?? [];
      if (slides.length >= state.maxSlides) return state;

      const insertionIndex = index ?? slides.length;
      const updated = [...slides];
      updated.splice(insertionIndex, 0, slide);

      return {
        ...state,
        slidesByBoard: {
          ...state.slidesByBoard,
          [boardSlug]: updated,
        },
      };
    }
    case 'remove': {
      const { boardSlug, slideId } = action;
      const slides = state.slidesByBoard[boardSlug] ?? [];
      return {
        ...state,
        slidesByBoard: {
          ...state.slidesByBoard,
          [boardSlug]: slides.filter((slide) => slide.id !== slideId),
        },
      };
    }
    case 'update': {
      const { boardSlug, slideId, updates } = action;
      const slides = state.slidesByBoard[boardSlug] ?? [];
      const updated = slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              ...updates,
              dirty: true,
            }
          : slide
      );

      return {
        ...state,
        slidesByBoard: {
          ...state.slidesByBoard,
          [boardSlug]: updated,
        },
      };
    }
    default:
      return state;
  }
}

export interface BoardsProviderProps {
  slidesByBoard?: SlidesByBoard;
  maxSlides?: number;
  children: React.ReactNode;
}

export function BoardsProvider({
  slidesByBoard = {},
  maxSlides = DEFAULT_MAX_SLIDES,
  children,
}: BoardsProviderProps) {
  const [state, dispatch] = useReducer(boardsReducer, {
    slidesByBoard,
    maxSlides,
  });

  const value = useMemo<BoardsContextValue>(
    () => ({
      ...state,
      reorderSlides: (boardSlug, activeId, overId) =>
        dispatch({ type: 'reorder', boardSlug, activeId, overId }),
      insertSlide: (boardSlug, slide, index) =>
        dispatch({ type: 'insert', boardSlug, slide, index }),
      removeSlide: (boardSlug, slideId) =>
        dispatch({ type: 'remove', boardSlug, slideId }),
      updateSlide: (boardSlug, slideId, updates) =>
        dispatch({ type: 'update', boardSlug, slideId, updates }),
    }),
    [state]
  );

  return <BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>;
}

export function useBoardsStore() {
  const context = useContext(BoardsContext);
  if (!context) {
    throw new Error('useBoardsStore must be used within a BoardsProvider');
  }
  return context;
}

export function createDuplicateSlide(source: Slide): Slide {
  return {
    ...source,
    id: `${source.id}-copy-${Date.now()}`,
    slug: `${source.slug}-copy`,
    title: `${source.title} (Copy)`,
    dirty: true,
  };
}
