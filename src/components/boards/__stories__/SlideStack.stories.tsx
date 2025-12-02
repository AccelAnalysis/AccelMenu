import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SlideStack } from '../SlideStack';
import { BoardsProvider } from '../../../store/boards';
import { AuthProvider } from '../../../state/authSlice';
import type { Slide } from '../../../api/models';

const sampleSlides: Slide[] = [
  {
    id: 'slide-1',
    slug: 'welcome-slide',
    title: 'Welcome',
    description: 'Hero headline with CTA',
    boardSlug: 'demo-board',
    locationSlug: 'hq',
    status: 'draft',
    publishAt: null,
    expireAt: null,
    published: false,
    dirty: false,
    mediaUrl: '',
    layout: 'default',
    position: 1,
  },
  {
    id: 'slide-2',
    slug: 'menu',
    title: 'Menu',
    description: 'Curated lunch specials',
    boardSlug: 'demo-board',
    locationSlug: 'hq',
    status: 'scheduled',
    publishAt: new Date().toISOString(),
    expireAt: null,
    published: false,
    dirty: false,
    mediaUrl: '',
    layout: 'default',
    position: 2,
  },
];

const meta: Meta<typeof SlideStack> = {
  title: 'Boards/SlideStack',
  component: SlideStack,
  decorators: [
    (Story) => (
      <AuthProvider initialUser={{ id: 'editor', name: 'Editor', role: 'editor' }}>
        <BoardsProvider slidesByBoard={{ 'demo-board': sampleSlides }}>
          <div className="max-w-3xl">
            <Story />
          </div>
        </BoardsProvider>
      </AuthProvider>
    ),
  ],
  args: {
    boardSlug: 'demo-board',
    locationSlug: 'hq',
  },
};

export default meta;
type Story = StoryObj<typeof SlideStack>;

export const VerticalStack: Story = {
  args: { orientation: 'vertical' },
};

export const HorizontalStack: Story = {
  args: { orientation: 'horizontal' },
};

export const FullStack: Story = {
  args: { maxSlides: 2 },
};
