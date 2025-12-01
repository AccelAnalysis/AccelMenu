import React, { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToHorizontalAxis, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Slide } from '../../api/models';
import {
  createDuplicateSlide,
  useBoardsStore,
} from '../../store/boards';

interface SlideStackProps {
  boardSlug: string;
  orientation?: 'vertical' | 'horizontal';
  maxSlides?: number;
}

interface SortableSlideProps {
  slide: Slide;
  orientation: 'vertical' | 'horizontal';
  index: number;
  onDuplicate: (slideId: string) => void;
  onDelete: (slideId: string) => void;
}

function SortableSlide({
  slide,
  orientation,
  index,
  onDuplicate,
  onDelete,
}: SortableSlideProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const badgeColor = slide.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
  const badgeLabel = slide.published ? 'Published' : 'Draft';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded border border-gray-200 bg-white p-3 shadow-sm transition hover:border-blue-400 hover:shadow-md ${
        orientation === 'horizontal' ? 'flex-col min-w-[200px]' : ''
      } ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
    >
      <button
        type="button"
        aria-label={`Reorder slide ${slide.title}`}
        className="cursor-grab rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 transition group-hover:bg-gray-200"
        {...attributes}
        {...listeners}
      >
        ↕
      </button>
      <div className="flex flex-1 flex-col gap-1 text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-500">#{index + 1}</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}
          >
            <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
            {badgeLabel}
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-900">{slide.title || 'Untitled slide'}</p>
        {slide.description ? (
          <p className="line-clamp-2 text-xs text-gray-600">{slide.description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          onClick={() => onDuplicate(slide.id)}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          onClick={() => onDelete(slide.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function SlideStack({
  boardSlug,
  orientation = 'vertical',
  maxSlides,
}: SlideStackProps) {
  const { slidesByBoard, reorderSlides, insertSlide, removeSlide, maxSlides: storeMaxSlides } =
    useBoardsStore();
  const slides = useMemo(() => slidesByBoard[boardSlug] ?? [], [slidesByBoard, boardSlug]);
  const maxAllowed = maxSlides ?? storeMaxSlides;
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const modifiers =
    orientation === 'horizontal' ? [restrictToHorizontalAxis] : [restrictToVerticalAxis];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSlides(boardSlug, String(active.id), String(over.id));
    }
  };

  const handleDuplicate = (slideId: string) => {
    if (slides.length >= maxAllowed) {
      window.alert(`You have reached the maximum of ${maxAllowed} slides.`);
      return;
    }

    const source = slides.find((slide) => slide.id === slideId);
    if (!source) return;
    const duplicate = createDuplicateSlide(source);
    const insertIndex = Math.min(slides.findIndex((slide) => slide.id === slideId) + 1, slides.length);
    insertSlide(boardSlug, duplicate, insertIndex);
  };

  const handleDelete = (slideId: string) => {
    const slide = slides.find((item) => item.id === slideId);
    const confirmMessage = `Delete slide${slide?.title ? ` "${slide.title}"` : ''}? This cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      removeSlide(boardSlug, slideId);
    }
  };

  const handleAddNew = () => {
    if (slides.length >= maxAllowed) {
      window.alert(`You have reached the maximum of ${maxAllowed} slides.`);
      return;
    }

    const nextIndex = slides.length + 1;
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      slug: `${boardSlug}-slide-${nextIndex}`,
      title: `Slide ${nextIndex}`,
      description: 'New slide description',
      boardSlug,
      locationSlug: '',
      published: false,
      dirty: true,
      mediaUrl: '',
      layout: 'default',
      position: nextIndex,
    };

    insertSlide(boardSlug, newSlide);
  };

  const emptyState = (
    <div className="flex flex-col items-center gap-3 rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
      <p>No slides yet. Add your first slide to get started.</p>
      <button
        type="button"
        className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        onClick={handleAddNew}
        disabled={slides.length >= maxAllowed}
      >
        Add slide
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">Slides</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            {slides.length} / {maxAllowed} slides
          </span>
          <button
            type="button"
            onClick={handleAddNew}
            disabled={slides.length >= maxAllowed}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            Add slide
          </button>
        </div>
      </div>

      {slides.length === 0 ? (
        emptyState
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={modifiers}
        >
          <SortableContext
            items={slides.map((slide) => slide.id)}
            strategy={
              orientation === 'horizontal'
                ? horizontalListSortingStrategy
                : verticalListSortingStrategy
            }
          >
            <div
              className={`flex gap-3 ${orientation === 'horizontal' ? 'flex-row overflow-x-auto' : 'flex-col'}`}
            >
              {slides.map((slide, index) => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  index={index}
                  orientation={orientation}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {slides.length >= maxAllowed ? (
        <p className="text-xs font-medium text-amber-700">Maximum slide count reached.</p>
      ) : null}
    </div>
  );
}

export default SlideStack;
