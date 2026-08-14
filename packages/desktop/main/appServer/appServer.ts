import path from 'path'
import { isProd } from '../env'
import log from '../log'
import appleMusic from './routes/apple_music/appleMusic'
import netease from './routes/netease/netease'
import unblock from './routes/netease/unblock'
import audio from './routes/netease/audio'
import fastifyCookie from '@fastify/cookie'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastify from 'fastify'

log.info('[electron] appServer/appServer.ts')

const initAppServer = async () => {
  const server = fastify({
    routerOptions: { ignoreTrailingSlash: true },
  })

  server.register(fastifyCookie)
  // 音频缓存上传走 multipart，默认 1MB 限制会让大文件直接 500
  server.register(fastifyMultipart, { limits: { fileSize: 100 * 1024 * 1024 } })
  if (isProd) {
    server.register(fastifyStatic, {
      root: path.join(__dirname, '../web'),
    })
  }

  server.register(netease)
  server.register(audio)
  server.register(appleMusic)
  server.register(unblock)

  const port = Number(
    isProd
      ? process.env.ELECTRON_WEB_SERVER_PORT || 42710
      : process.env.ELECTRON_DEV_NETEASE_API_PORT || 30001
  )
  await server.listen({ port })
  log.info(`[appServer] http server listening on port ${port}`)

  return server
}

export default initAppServer
