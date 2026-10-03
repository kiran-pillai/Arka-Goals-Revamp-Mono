import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import '@testing-library/jest-dom/vitest';

// Polyfill browser APIs for jsdom (needed by Mantine)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock Mantine Textarea to avoid autosize crash in jsdom
vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual<typeof import('@mantine/core')>('@mantine/core');
  return {
    ...actual,
    Textarea: (props: any) => (
      <textarea
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
        onKeyDown={props.onKeyDown}
        rows={props.minRows ?? 1}
      />
    ),
  };
});

import CheckInTimeline from './CheckInTimeline';
import type { CheckIn } from '../checkin';

const CHECKINS: CheckIn[] = [
  {
    id: 'c1',
    completedGoal: true,
    results: 'Shipped onboarding',
    commitments: 'Launch to 100%',
    wins: 'Great collab',
    frictions: 'CI flaky',
    createdAt: '2026-10-01T12:00:00Z',
    user: { email: 'sarah@ex.com', firstName: 'Sarah', lastName: 'Chen', colorSlot: 0 },
    comments: [
      { id: 'cm1', text: 'Nice work!', createdAt: '2026-10-01T14:00:00Z', user: { email: 'marcus@ex.com', firstName: 'Marcus', lastName: 'Johnson', colorSlot: 1 } },
      { id: 'cm2', text: 'Agreed', createdAt: '2026-10-01T15:00:00Z', user: { email: 'alex@ex.com', firstName: 'Alex', lastName: 'Rivera', colorSlot: 3 } },
    ],
  },
  {
    id: 'c2',
    completedGoal: false,
    results: 'Got 80% through migration',
    commitments: 'Finish migration',
    wins: 'Fixed race condition',
    frictions: 'Credential wait',
    createdAt: '2026-10-01T10:00:00Z',
    user: { email: 'marcus@ex.com', firstName: 'Marcus', lastName: 'Johnson', colorSlot: 1 },
    comments: [],
  },
  {
    id: 'c3',
    completedGoal: true,
    results: 'Finished prototype',
    commitments: 'Incorporate feedback',
    wins: 'User testing insightful',
    frictions: 'Scheduling hard',
    createdAt: '2026-09-24T12:00:00Z',
    user: { email: 'sarah@ex.com', firstName: 'Sarah', lastName: 'Chen', colorSlot: 0 },
    comments: [],
  },
];

function renderTimeline(checkins = CHECKINS) {
  return render(
    <MantineProvider>
      <CheckInTimeline checkIns={checkins} onAddComment={vi.fn()} onDeleteComment={vi.fn()} />
    </MantineProvider>,
  );
}

describe('CheckInTimeline', () => {
  it('renders week group headers', () => {
    renderTimeline();

    // Two different weeks in the test data
    expect(screen.getByText(/Week of Sep 28, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Week of Sep 21, 2026/)).toBeInTheDocument();
  });

  it('renders timeline items with user avatar showing initials', () => {
    renderTimeline();

    // Sarah Chen -> SC, Marcus Johnson -> MJ
    expect(screen.getAllByText('SC').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MJ').length).toBeGreaterThanOrEqual(1);
  });

  it('maps avatar background color from colorSlot to AVATAR_COLOR_POOL', async () => {
    const { container } = renderTimeline();

    // The first avatar (Sarah, slot 0) should use the first pool color
    const avatars = container.querySelectorAll('[data-testid="avatar"]');
    expect(avatars.length).toBeGreaterThan(0);

    const firstAvatar = avatars[0] as HTMLElement;
    // AVATAR_COLOR_POOL[0] is '#e6a532' — jsdom normalizes to rgb
    expect(firstAvatar.style.backgroundColor).toBe('rgb(230, 165, 50)');
  });

  it('shows goal met badge for completed goals', () => {
    renderTimeline();

    const goalMetBadges = screen.getAllByText('Goal met');
    expect(goalMetBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows not met badge for incomplete goals', () => {
    renderTimeline();

    expect(screen.getByText('Not met')).toBeInTheDocument();
  });

  it('shows comment count pill on collapsed items with comments', () => {
    renderTimeline();

    // c1 has 2 comments — should show "2" in a pill
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not show comment count pill on items with no comments', () => {
    renderTimeline([CHECKINS[1]]); // c2 has 0 comments

    expect(screen.queryByTestId('comment-pill')).not.toBeInTheDocument();
  });

  it('expands to show full check-in fields when clicked', async () => {
    const user = userEvent.setup();
    renderTimeline();

    // Fields should be hidden initially
    expect(screen.queryByText('Shipped onboarding')).not.toBeInTheDocument();

    // Click the first timeline item header
    const headers = screen.getAllByTestId('timeline-header');
    await user.click(headers[0]);

    // Now the results field should be visible
    expect(screen.getByText('Shipped onboarding')).toBeInTheDocument();
    expect(screen.getByText('Launch to 100%')).toBeInTheDocument();
    expect(screen.getByText('Great collab')).toBeInTheDocument();
    expect(screen.getByText('CI flaky')).toBeInTheDocument();
  });

  it('shows member name on each timeline entry', () => {
    renderTimeline();

    expect(screen.getAllByText('Sarah Chen').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Marcus Johnson').length).toBeGreaterThanOrEqual(1);
  });
});
