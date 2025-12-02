import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SlideStack } from '../SlideStack';
import { BoardsProvider } from '../../../store/boards';
import { AuthProvider } from '../../../state/authSlice';
import type { Slide } from '../../../api/models';

const baseSlide: Slide = {
  id: 'slide-1',
  slug: 'board-1-slide-1',
  title: 'Welcome slide',
  description: 'Hero welcome message',
  boardSlug: 'board-1',
  locationSlug: 'hq',
  status: 'draft',
  publishAt: null,
  expireAt: null,
  published: false,
  dirty: false,
  mediaUrl: '',
  layout: 'default',
  position: 1,
};

function renderStack(slides: Slide[], maxSlides = 5, role: 'editor' | 'viewer' = 'editor') {
  return render(
    <AuthProvider initialUser={{ id: 'user-1', name: 'Test User', role }}>
      <BoardsProvider slidesByBoard={{ 'board-1': slides }} maxSlides={maxSlides}>
        <SlideStack boardSlug="board-1" locationSlug="hq" />
      </BoardsProvider>
    </AuthProvider>
  );
}

describe('SlideStack', () => {
  it('renders empty state and allows creating a slide', async () => {
    const user = userEvent.setup();
    renderStack([], 3);

    expect(screen.getByText(/no slides yet/i)).toBeInTheDocument();
    expect(screen.getByText('0 / 3 slides')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add slide/i }));

    expect(screen.getByText(/1 \/ 3 slides/i)).toBeInTheDocument();
    expect(screen.getByText(/slide 1/i)).toBeInTheDocument();
  });

  it('duplicates slides via the menu', async () => {
    const user = userEvent.setup();
    renderStack([baseSlide], 4);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    const menuRoot = screen.getByText(/duplicate/i).closest('div');
    expect(menuRoot).not.toBeNull();
    const menu = within(menuRoot as HTMLElement);
    await user.click(menu.getByRole('button', { name: /duplicate/i }));

    expect(screen.getAllByText(/welcome slide/i)).toHaveLength(1);
    expect(screen.getByText(/welcome slide \(Copy\)/i)).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 4 slides/i)).toBeInTheDocument();
  });

  it('removes a slide when editors confirm deletion', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderStack([baseSlide], 3, 'editor');

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByText(/no slides yet/i)).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
