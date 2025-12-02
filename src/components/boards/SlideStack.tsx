import React, { useMemo, useState } from 'react';
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
import { Slide, Template } from '../../api/models';
import {
  createDuplicateSlide,
  useBoardsStore,
} from '../../store/boards';
import { TemplateGallery } from '../templates/TemplateGallery';
import SchedulePanel from './SchedulePanel';
import { useAuth } from '../../state/authSlice';

interface SlideStackProps {
  boardSlug: string;
  locationSlug?: string;
  orientation?: 'vertical' | 'horizontal';
  maxSlides?: number;
}

interface SortableSlideProps {
  slide: Slide;
  orientation: 'vertical' | 'horizontal';
  index: number;
  onDuplicate: (slideId: string) => void;
  onDelete: (slideId: string) => void;
  onApplyTemplate: (slide: Slide) => void;
  onSchedule: (slide: Slide) => void;
  isMenuOpen: boolean;
  onToggleMenu: (slideId: string) => void;
  canDelete: boolean;
}

function SortableSlide({
  slide,
  orientation,
  index,
  onDuplicate,
  onDelete,
  onApplyTemplate,
  onSchedule,
  isMenuOpen,
  onToggleMenu,
  canDelete,
}: SortableSlideProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const badgeColor =
    slide.status === 'published'
      ? 'bg-green-100 text-green-700'
      : slide.status === 'scheduled'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-amber-100 text-amber-700';
  const badgeLabel =
    slide.status === 'published'
      ? 'Published'
      : slide.status === 'scheduled'
        ? 'Scheduled'
        : 'Draft';

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
        {slide.publishAt ? (
          <p className="text-[11px] text-gray-500">
            Publishes {new Date(slide.publishAt).toLocaleString()}
          </p>
        ) : null}
        {slide.expireAt ? (
          <p className="text-[11px] text-gray-500">Expires {new Date(slide.expireAt).toLocaleString()}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            className="rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            onClick={() => onToggleMenu(slide.id)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            Menu
          </button>
          {isMenuOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-40 rounded border border-gray-200 bg-white py-1 text-sm shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50"
                onClick={() => onDuplicate(slide.id)}
              >
                Duplicate
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50"
                onClick={() => onApplyTemplate(slide)}
              >
                Apply template
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50"
                onClick={() => onSchedule(slide)}
              >
                Schedule
              </button>
              <button
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-red-50 ${
                  canDelete
                    ? 'text-red-700'
                    : 'cursor-not-allowed text-gray-300 hover:bg-transparent'
                }`}
                onClick={() => onDelete(slide.id)}
                disabled={!canDelete}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SlideStack({
  boardSlug,
  locationSlug,
  orientation = 'vertical',
  maxSlides,
}: SlideStackProps) {
  const {
    slidesByBoard,
    reorderSlides,
    insertSlide,
    removeSlide,
    updateSlide,
    maxSlides: storeMaxSlides,
  } = useBoardsStore();
  const { canDeleteSlides } = useAuth();
  const slides = useMemo(() => slidesByBoard[boardSlug] ?? [], [slidesByBoard, boardSlug]);
  const maxAllowed = maxSlides ?? storeMaxSlides;
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [templateTarget, setTemplateTarget] = useState<Slide | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<Slide | null>(null);
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
    if (!canDeleteSlides) {
      window.alert('You need editor access to delete slides.');
      return;
    }

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
      locationSlug: locationSlug ?? '',
      status: 'draft',
      publishAt: null,
      expireAt: null,
      published: false,
      dirty: true,
      mediaUrl: '',
      layout: 'default',
      position: nextIndex,
    };

    insertSlide(boardSlug, newSlide);
  };

  const handleApplyTemplate = (template: Template) => {
    if (!templateTarget) return;
    setApplyingTemplate(true);
    updateSlide(boardSlug, templateTarget.id, {
      templateId: template.id,
      layout: template.layout,
      title: templateTarget.title || template.name,
      description: template.description ?? templateTarget.description,
      layers: template.layers ?? templateTarget.layers,
      assets: template.assets ?? templateTarget.assets,
    });
    setApplyingTemplate(false);
    setTemplateTarget(null);
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
                  onApplyTemplate={(target) => {
                    setTemplateTarget(target);
                    setMenuOpenFor(null);
                  }}
                  onSchedule={(target) => {
                    setScheduleTarget(target);
                    setMenuOpenFor(null);
                  }}
                  isMenuOpen={menuOpenFor === slide.id}
                  onToggleMenu={(slideId) =>
                    setMenuOpenFor((current) => (current === slideId ? null : slideId))
                  }
                  canDelete={canDeleteSlides}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {slides.length >= maxAllowed ? (
        <p className="text-xs font-medium text-amber-700">Maximum slide count reached.</p>
      ) : null}

      <TemplateGallery
        open={Boolean(templateTarget)}
        onClose={() => setTemplateTarget(null)}
        onApply={handleApplyTemplate}
        activeTemplateId={templateTarget?.templateId}
      />

      <SchedulePanel
        open={Boolean(scheduleTarget)}
        slide={scheduleTarget}
        boardSlug={boardSlug}
        locationSlug={locationSlug ?? scheduleTarget?.locationSlug}
        onClose={() => setScheduleTarget(null)}
      />

      {applyingTemplate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/10 text-sm text-gray-700">
          Applying template…
        </div>
      ) : null}
    </div>
  );
}

export default SlideStack;
