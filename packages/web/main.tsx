import './utils/gsapSetup'
import './utils/initLog'
import './utils/theme'
import { StrictMode } from 'react'
import * as ReactDOMClient from 'react-dom/client'
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
  HashRouter,
} from 'react-router-dom'
import * as Sentry from '@sentry/react'
import 'virtual:svg-icons-register'
import './styles/global.css'
import './styles/accentColor.css'
import App from './App'
import pkg from '../../package.json'
import ReactGA from 'react-ga4'
import { ipcRenderer } from './ipcRenderer'
import { QueryClientProvider } from '@tanstack/react-query'
import reactQueryClient from '@/web/utils/reactQueryClient'
import React from 'react'
import './i18n/i18n'
import { appName } from './utils/const'

// google analytic — web build only; the Electron app must not phone home.
if (!window.ipcRenderer) {
  ReactGA.initialize('G-QFPDJGN751')
}

// 前端报错监控
Sentry.init({
  dsn: 'https://7d8a408fb378f9b378be20cff43de801@o4505816875532288.ingest.sentry.io/4505816882151424',
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
  release: `${appName}@${pkg.version}`,
  environment: import.meta.env.MODE,

  // Capture 100% of transactions in dev for debugging, but sample down to
  // 5% in production — full-rate tracing is far too heavy for low-end
  // machines and floods Sentry.
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.05,
})

ipcRenderer()

const container = document.getElementById('root') as HTMLElement
const root = ReactDOMClient.createRoot(container)

root.render(
  <StrictMode>
    <HashRouter>
      <QueryClientProvider client={reactQueryClient}>
        <App />
      </QueryClientProvider>
    </HashRouter>
  </StrictMode>
)
