import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import type { AuthUser } from './auth/auth'
import LoginRoute from './routes/LoginRoute'
import AuthCallbackRoute from './routes/AuthCallbackRoute'
import AdminInvitesRoute from './routes/AdminInvitesRoute'
import AppShellLayout from './AppShellLayout'
import CheckInsTable from './CheckInsTable'
import WeeklyCheckIn from './WeeklyCheckIn'
import GoalSetup from './GoalSetup'
import GoalsTable from './GoalsTable'

export interface RouterContext {
  auth: { user: AuthUser | null }
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginRoute,
})

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: AuthCallbackRoute,
})

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: ({ context }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppShellLayout,
})

const homeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: CheckInsTable,
})

const formRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/form',
  component: WeeklyCheckIn,
})

const goalSetupRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/goals/new',
  component: GoalSetup,
})

const goalsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/goals',
  component: GoalsTable,
})

const adminInvitesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/admin/invites',
  beforeLoad: ({ context }) => {
    if (context.auth.user!.role !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: AdminInvitesRoute,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  authCallbackRoute,
  layoutRoute.addChildren([
    homeRoute,
    formRoute,
    goalSetupRoute,
    goalsRoute,
    adminInvitesRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  context: { auth: { user: null } },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
