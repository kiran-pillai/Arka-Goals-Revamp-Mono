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
import HomeRoute from './routes/HomeRoute'
import AdminInvitesRoute from './routes/AdminInvitesRoute'

/**
 * Router context. `auth.user` is kept in sync with AuthContext (see main.tsx)
 * so `beforeLoad` guards can read the current user before rendering a route.
 */
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

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: HomeRoute,
})

const adminInvitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/invites',
  beforeLoad: ({ context }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/login' })
    }
    if (context.auth.user.role !== 'ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: AdminInvitesRoute,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  authCallbackRoute,
  homeRoute,
  adminInvitesRoute,
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
