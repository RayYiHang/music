import { join } from 'path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import multipart from '@fastify/multipart'

const app: FastifyPluginAsync<AutoloadPluginOptions> = async (fastify, opts) => {
  fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  })

  fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts,
  })
  fastify.register(fastifyCookie)
  // 音频缓存上传走 multipart，默认 1MB 限制会让大文件直接 500
  fastify.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } })
}

export default app
export { app }
