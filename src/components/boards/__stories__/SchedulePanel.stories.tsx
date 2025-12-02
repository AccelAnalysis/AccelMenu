import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import SchedulePanel from '../SchedulePanel';
import type { Slide } from '../../../api/models';
import { BoardsProvider } from '../../../store/boards';

const slide: Slide = {
  id: 'schedule-target',
  slug: 'schedule-target',
  title: 'Seasonal Promo',
  description: 'Limited time menu pairing',
  boardSlug: 'demo-board',
  locationSlug: 'hq',
  status: 'scheduled',
  publishAt: new Date().toISOString(),
  expireAt: null,
  published: false,
  dirty: false,
  mediaUrl: '',
  layout: 'default',
  position: 1,
};

const meta: Meta<typeof SchedulePanel> = {
  title: 'Boards/SchedulePanel',
  component: SchedulePanel,
  decorators: [
    (Story) => (
      <BoardsProvider slidesByBoard={{ 'demo-board': [slide] }}>
        <Story />
      </BoardsProvider>
    ),
  ],
  args: {
    open: true,
    slide,
    boardSlug: 'demo-board',
    locationSlug: 'hq',
  },
};

export default meta;
type Story = StoryObj<typeof SchedulePanel>;

export const Default: Story = {};

export const Draft: Story = {
  args: {
    slide: { ...slide, status: 'draft', publishAt: null, expireAt: null },
  },
};
