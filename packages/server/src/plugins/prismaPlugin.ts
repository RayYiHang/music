import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { PrismaClient } from '@prisma/client' // Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (server, options) => {
  // schema.prisma 通过 env("DATABASE_URL") 读取连接串：容器/部署环境会显式
  // 设置；本地 dev 没有 dotenv，回退到旧版 schema 硬编码 url 的同一位置
  // （引擎按 schema 目录解析相对路径 → packages/server/prisma/musicInfo.db）
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL ?? 'file:./musicInfo.db',
  })

  await prisma.$connect()

  // Make Prisma Client available through the fastify server instance: server.prisma
  server.decorate('prisma', prisma)

  server.addHook('onClose', async server => {
    await server.prisma.$disconnect()
  })
})

export default prismaPlugin
