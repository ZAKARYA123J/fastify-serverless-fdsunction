import { PrismaClient } from '@prisma/client'

const defaultPrisma = new PrismaClient()

export function createAuthMiddleware(fastify, prismaClient = defaultPrisma) {
  return async function authenticate(request, reply) {
    const authHeader = request.headers['authorization']

    if (!authHeader) {
      reply.code(401).send({ error: 'No authorization header provided' })
      return
    }

    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      reply.code(401).send({ error: 'No token provided' })
      return
    }

    try {
      const decoded = await request.jwtVerify()

      // Get full user data with role-specific information
      const user = await prismaClient.user.findUnique({
        where: { id: decoded.id },
        include: {
          coche: true,
          staff: true,
          admin: true,
        }
      })

      if (!user) {
        reply.code(401).send({ error: 'User not found' })
        return
      }

      // Determine user role
      let role = 'USER'
      if (user.coche) role = 'COCHE'
      if (user.staff) role = 'STAFF'
      if (user.admin) role = 'ADMIN'

      request.user = { ...user, role }
    } catch (err) {
      reply.code(401).send({ error: 'Invalid token' })
    }
  }
}

export function checkRole(roles) {
  return async (request, reply) => {
    if (!request.user) {
      reply.code(401).send({ error: 'Unauthorized' })
      return
    }

    if (!roles.includes(request.user.role)) {
      reply.code(403).send({ error: 'Forbidden' })
      return
    }
  }
}
