import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

// Mock useAuth before importing the component
vi.mock('./auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock TanStack Router hooks
vi.mock('@tanstack/react-router', () => ({
  Outlet: () => <div data-testid="outlet" />,
  useNavigate: () => vi.fn(),
  useRouterState: () => ({
    location: { pathname: '/' },
  }),
}));



import AppShellLayout from './AppShellLayout';
import { useAuth } from './auth/AuthContext';

const mockedUseAuth = vi.mocked(useAuth);

describe('AppShellLayout – user initials badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display initials badge "KP" when user has firstName "Kiran" and lastName "Pillai"', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'kiran@example.com',
        role: 'ADMIN',
        firstName: 'Kiran',
        lastName: 'Pillai',
      },
      loading: false,
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MantineProvider>
        <AppShellLayout />
      </MantineProvider>,
    );

    // Expect an initials badge showing "KP" (first letter of first name + first letter of last name)
    const badge = screen.getByText('KP');
    expect(badge).toBeInTheDocument();
  });

  it('should NOT display the raw email when user has first and last name', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'kiran@example.com',
        role: 'ADMIN',
        firstName: 'Kiran',
        lastName: 'Pillai',
      },
      loading: false,
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MantineProvider>
        <AppShellLayout />
      </MantineProvider>,
    );

    // The raw email should no longer be displayed when name fields are available
    expect(screen.queryByText('kiran@example.com')).not.toBeInTheDocument();
  });

  it('should show the initials badge next to the Sign Out button', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'kiran@example.com',
        role: 'MEMBER',
        firstName: 'Kiran',
        lastName: 'Pillai',
      },
      loading: false,
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MantineProvider>
        <AppShellLayout />
      </MantineProvider>,
    );

    const badge = screen.getByText('KP');
    const signOutButton = screen.getByText('Sign Out');

    // Both should be present in the document
    expect(badge).toBeInTheDocument();
    expect(signOutButton).toBeInTheDocument();

    // The badge and sign-out button should share a common parent (the header Group)
    expect(badge.closest('[class*="Group"], [class*="group"]') ||
           badge.parentElement).toContain(signOutButton);
  });

  it('should fall back to email display when name fields are missing', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-2',
        email: 'anon@example.com',
        role: 'MEMBER',
      },
      loading: false,
      refresh: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MantineProvider>
        <AppShellLayout />
      </MantineProvider>,
    );

    // With no name fields, should still show the email
    expect(screen.getByText('anon@example.com')).toBeInTheDocument();
  });
});
