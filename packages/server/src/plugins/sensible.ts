import fp from 'fastify-plugin'
import sensible from '@fastify/sensible'

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
// v6 renamed SensibleOptions → FastifySensibleOptions and removed the
// errorHandler option (it no longer registers an error handler).
export default fp(async (fastify, opts) => {
  fastify.register(sensible)
})
