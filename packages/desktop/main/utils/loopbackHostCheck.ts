import { FastifyInstance } from 'fastify'

/**
 * 只接受回环地址的 Host 头。服务器上都是本机服务（音频缓存、API 代理），
 * 不做这个校验的话，外部网页把域名解析到 127.0.0.1（DNS rebinding）就能
 * 以合法源身份读取本地接口的响应。dev 模式 vite 代理配了 changeOrigin，
 * 转发过来的 Host 同样是 127.0.0.1:<port>。
 */
export function registerLoopbackHostCheck(server: FastifyInstance, port: number) {
  const allowedHosts = new Set([
    `127.0.0.1:${port}`,
    `localhost:${port}`,
    `[::1]:${port}`,
  ])
  server.addHook('onRequest', async (req, reply) => {
    const requestHost = (req.headers.host || '').toLowerCase()
    if (!allowedHosts.has(requestHost)) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
  })
}
