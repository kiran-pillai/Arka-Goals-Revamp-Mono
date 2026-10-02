import {
  AppShell,
  Burger,
  Button,
  Group,
  ScrollArea,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { useComputedColorScheme } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  IconHome,
  IconClipboardText,
  IconTargetArrow,
  IconListCheck,
  IconMailForward,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'
import { useAuth } from './auth/AuthContext'

const light = {
  amber: '#e6a532',
  bronze: '#a85f22',
  border: '#ecdcc0',
  navBg: '#fffdf8',
  brandPillBg: 'rgba(244, 243, 236, 0.5)',
  activeItemBg: 'rgba(230, 165, 50, 0.12)',
  hoverItemBg: 'rgba(230, 165, 50, 0.06)',
}

const dark = {
  amber: '#f0b849',
  bronze: '#d08a3a',
  border: '#3a3226',
  navBg: '#1d1a15',
  brandPillBg: 'rgba(47, 48, 58, 0.5)',
  activeItemBg: 'rgba(230, 165, 50, 0.15)',
  hoverItemBg: 'rgba(230, 165, 50, 0.08)',
}

interface NavItem {
  label: string
  icon: typeof IconHome
  path: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home Page', icon: IconHome, path: '/' },
  { label: 'Enter Weekly Form', icon: IconClipboardText, path: '/form' },
  { label: 'Set Goals', icon: IconTargetArrow, path: '/goals/new' },
  { label: 'View Goals', icon: IconListCheck, path: '/goals' },
  { label: 'Manage Invites', icon: IconMailForward, path: '/admin/invites', adminOnly: true },
]

export default function AppShellLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const colorScheme = useComputedColorScheme('dark')
  const t = colorScheme === 'dark' ? dark : light

  const isMobile = useMediaQuery('(max-width: 768px)')
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()
  const [collapsed, { toggle: toggleCollapsed }] = useDisclosure(false)

  const navbarCollapsed = isMobile ? !mobileOpened : collapsed

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN',
  )

  function isActive(path: string) {
    return currentPath === path
  }

  async function handleSignOut() {
    await logout()
    navigate({ to: '/login' })
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: navbarCollapsed ? 60 : 240,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
      styles={{
        header: {
          borderBottom: `1px solid ${t.border}`,
        },
        navbar: {
          borderRight: `1px solid ${t.border}`,
          backgroundColor: t.navBg,
          transition: 'width 200ms ease',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 18px 8px 8px',
                border: `1px solid ${t.border}`,
                borderRadius: 999,
                background: t.brandPillBg,
              }}
            >
              <img
                src="/images/Arka_Icon.webp"
                alt="Arka"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'block',
                }}
              />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: 3,
                  color: t.bronze,
                }}
              >
                ARKA
              </span>
            </div>
          </Group>

          <Group gap="sm">
            {user && (
              <Text size="sm" c="dimmed" visibleFrom="sm">
                {user.email}
              </Text>
            )}
            <Button
              variant="subtle"
              color="gray"
              size="compact-sm"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <AppShell.Section grow component={ScrollArea} py="sm">
          {visibleItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon

            const button = (
              <UnstyledButton
                key={item.path}
                onClick={() => {
                  navigate({ to: item.path })
                  if (isMobile) toggleMobile()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: navbarCollapsed ? '10px 0' : '10px 16px',
                  justifyContent: navbarCollapsed ? 'center' : 'flex-start',
                  borderLeft: active
                    ? `3px solid ${t.bronze}`
                    : '3px solid transparent',
                  backgroundColor: active
                    ? t.activeItemBg
                    : 'transparent',
                  color: active ? t.bronze : undefined,
                  fontWeight: active ? 600 : 500,
                  fontSize: 14,
                  borderRadius: 0,
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor =
                      t.hoverItemBg
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor =
                      'transparent'
                  }
                }}
              >
                <Icon size={20} stroke={1.5} />
                {!navbarCollapsed && <span>{item.label}</span>}
              </UnstyledButton>
            )

            if (navbarCollapsed) {
              return (
                <Tooltip
                  key={item.path}
                  label={item.label}
                  position="right"
                  withArrow
                >
                  {button}
                </Tooltip>
              )
            }

            return button
          })}
        </AppShell.Section>

        <AppShell.Section>
          <UnstyledButton
            onClick={toggleCollapsed}
            visibleFrom="sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              padding: navbarCollapsed ? '10px 0' : '10px 16px',
              justifyContent: navbarCollapsed ? 'center' : 'flex-start',
              fontSize: 12,
              color: '#888',
              borderTop: `1px solid ${t.border}`,
            }}
          >
            {navbarCollapsed ? (
              <IconChevronsRight size={16} />
            ) : (
              <>
                <IconChevronsLeft size={16} />
                <span>Collapse</span>
              </>
            )}
          </UnstyledButton>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
        <footer
          style={{
            textAlign: 'center',
            fontSize: 12,
            letterSpacing: 0.3,
            color: '#888',
            padding: '16px 0',
          }}
        >
          An Arka organization squad
        </footer>
      </AppShell.Main>
    </AppShell>
  )
}
