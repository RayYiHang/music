import * as Sentry from '@sentry/electron/main'
import pkg from '../../../package.json'
import { appName, isDev } from './env'
import log from './log'

// 本地开发完全不上传：错误、性能数据一概不发（ tracing 插桩本身也有
// 可感知的 CPU 开销）。生产端 5% 采样。
if (isDev) {
  log.info(`[sentry] dev environment, skipping Sentry.init (no uploads)`)
} else {
  log.info(`[sentry] sentry initializing`)

  Sentry.init({
    dsn: 'https://7d8a408fb378f9b378be20cff43de801@o4505816875532288.ingest.sentry.io/4505816882151424',
    release: `${appName}@${pkg.version}`,
    environment: process.env.NODE_ENV,

    // 5% 采样是 Sentry 官方对高流量应用的建议值；1.0 会把配额在
    // 几分钟内烧完，低端机上全量插桩的 CPU 开销也可观。
    tracesSampleRate: 0.05,
  })

  log.info(`[sentry] sentry initialized`)
}
