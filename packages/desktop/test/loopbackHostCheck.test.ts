import { describe, expect, it } from 'vitest'
import fastify, { FastifyInstance } from 'fastify'
import { registerLoopbackHostCheck } from '../main/utils/loopbackHostCheck'

const PORT = 42710

const build = async () => {
  const server = fastify()
  registerLoopbackHostCheck(server, PORT)
  // 路由都挂在子插件上下文里，和 appServer.ts 的 register 结构保持一致，
  // 顺便验证根实例上的 hook 能覆盖子插件路由
  server.register(async (child: FastifyInstance) => {
    child.get('/r3playx/audio/:filename', async () => 'ok')
  })
  await server.ready()
  return server
}

describe('registerLoopbackHostCheck', () => {
  it('allows loopback hosts on the listening port', async () => {
    const server = await build()
    for (const host of [`127.0.0.1:${PORT}`, `localhost:${PORT}`, `[::1]:${PORT}`]) {
      const res = await server.inject({ method: 'GET', url: '/r3playx/audio/1-320000.mp3', headers: { host } })
      expect(res.statusCode).toBe(200)
    }
  })

  it('rejects a foreign host (DNS rebinding)', async () => {
    const server = await build()
    const res = await server.inject({
      method: 'GET',
      url: '/r3playx/audio/1-320000.mp3',
      headers: { host: 'attacker.example' },
    })
    expect(res.statusCode).toBe(403)
    expect(res.body).not.toContain('ok')
  })

  it('rejects a loopback hostname with the wrong port', async () => {
    const server = await build()
    const res = await server.inject({
      method: 'GET',
      url: '/r3playx/audio/1-320000.mp3',
      headers: { host: `127.0.0.1:${PORT + 1}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('rejects a missing Host header', async () => {
    const server = await build()
    const res = await server.inject({ method: 'GET', url: '/r3playx/audio/1-320000.mp3' })
    expect(res.statusCode).toBe(403)
    expect(res.body).not.toContain('ok')
  })

  it('is case-insensitive on the host value', async () => {
    const server = await build()
    const res = await server.inject({
      method: 'GET',
      url: '/r3playx/audio/1-320000.mp3',
      headers: { host: `LOCALHOST:${PORT}` },
    })
    expect(res.statusCode).toBe(200)
  })
})
