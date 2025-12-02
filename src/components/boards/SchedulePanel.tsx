import { useEffect, useMemo, useState } from 'react';
import { cacheSlides, updateSlideSchedule } from '../../api/client';
import type { Slide } from '../../api/models';
import { useBoardsStore } from '../../store/boards';

interface SchedulePanelProps {
  open: boolean;
  slide: Slide | null;
  boardSlug: string;
  locationSlug?: string;
  onClose: () => void;
}

const statusOptions: Array<{ value: Slide['status']; label: string; description: string }> = [
  { value: 'draft', label: 'Draft', description: 'Keep the slide internal while you work.' },
  {
    value: 'scheduled',
    label: 'Scheduled',
    description: 'Set a publish and optional expiry window.',
  },
  { value: 'published', label: 'Published', description: 'Make the slide immediately live.' },
];

function toInputDateValue(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function toIsoString(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function SchedulePanel({
  open,
  slide,
  boardSlug,
  locationSlug,
  onClose,
}: SchedulePanelProps) {
  const { updateSlide, slidesByBoard } = useBoardsStore();
  const [status, setStatus] = useState<Slide['status']>('draft');
  const [publishAt, setPublishAt] = useState('');
  const [expireAt, setExpireAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedLocationSlug = useMemo(
    () => locationSlug || slide?.locationSlug || '',
    [locationSlug, slide?.locationSlug]
  );

  useEffect(() => {
    if (!slide) return;
    setStatus(slide.status ?? 'draft');
    setPublishAt(toInputDateValue(slide.publishAt));
    setExpireAt(toInputDateValue(slide.expireAt));
    setError(null);
  }, [slide]);

  if (!open || !slide) return null;

  const handleSave = async () => {
    if (!resolvedLocationSlug) {
      setError('Missing location context for scheduling.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        status,
        publishAt: status === 'draft' ? null : toIsoString(publishAt),
        expireAt: toIsoString(expireAt),
      };

      cacheSlides(resolvedLocationSlug, boardSlug, slidesByBoard[boardSlug] ?? []);
      const updatedSlide = await updateSlideSchedule(
        resolvedLocationSlug,
        boardSlug,
        slide.id,
        payload
      );
      updateSlide(boardSlug, slide.id, updatedSlide);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setPublishAt('');
    setExpireAt('');
    setStatus('draft');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase text-gray-500">Scheduling</p>
            <h3 className="text-lg font-semibold text-gray-900">{slide.title}</h3>
            <p className="text-sm text-gray-600">Control when this slide is visible to guests.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-gray-500">Status</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`rounded border px-3 py-2 text-left transition ${
                    status === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="block text-xs text-gray-600">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-gray-700">Publish at</span>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(event) => setPublishAt(event.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Select date"
              />
              <span className="block text-xs text-gray-500">
                Optional. Set a start time for scheduled publishing.
              </span>
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-gray-700">Expire at</span>
              <input
                type="datetime-local"
                value={expireAt}
                onChange={(event) => setExpireAt(event.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Select date"
              />
              <span className="block text-xs text-gray-500">Optional. Hide the slide after this time.</span>
            </label>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="rounded border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Clear schedule
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {saving ? 'Saving…' : 'Save schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
