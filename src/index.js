"use strict";
import Fastify from 'fastify'
import { PrismaClient } from '@prisma/client'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { authRoutes } from './routes/auth.routes.js'
import { adminRoutes } from './routes/admin.routes.js'
import { notificationRoutes } from './routes/notification.routes.js'
import { createAuthMiddleware } from './middleware/auth.middleware.js'
import { createNotificationMiddleware } from './middleware/notification.middleware.js'
import * as dotenv from "dotenv";
dotenv.config();
const fastify = Fastify({ 
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  },
  trustProxy: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      useDefaults: true,
      coerceTypes: true,
      allErrors: true
    }
  }
})



// Create HTTP server
const httpServer = createServer(fastify.server)

// Create Socket.IO instance
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Make fastify instance available to Socket.IO
io.fastify = fastify

// Make io available to routes
fastify.decorate('io', io)

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET,
  sign: {
    expiresIn: '1d'
  }
})

// Register authentication middleware
fastify.decorate('authenticate', createAuthMiddleware(fastify))
// Register notification middleware
fastify.addHook('onRequest', createNotificationMiddleware(fastify))
// Register routes with API versioning prefix
fastify.get('/api', async (req, reply) => {
  return reply.status(200).type('text/html').send(html)
})

fastify.register(authRoutes, { prefix: '/api/auth' })
fastify.register(adminRoutes, { prefix: '/api/admin' })
fastify.register(notificationRoutes, { prefix: '/api/notifications' })

// Health check route
fastify.get('/', async (req, reply) => {
  return reply.status(200).type('text/html').send(html)
})
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})
const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css"
    />
    <title>Vercel + Fastify Hello World</title>
    <meta
      name="description"
      content="This is a starter template for Vercel + Fastify."
    />
  </head>
  <body>
    <h1>Vercel + Fastify Hello World</h1>
    <p>
      This is a starter template for Vercel + Fastify. Requests are
      rewritten from <code>/*</code> to <code>/api/*</code>, which runs
      as a Vercel Function.
    </p>
    <p>
        For example, here is the boilerplate code for this route:
    </p>
    <pre>
<code>import Fastify from 'fastify'

const app = Fastify({
  logger: true,
})

app.get('/', async (req, res) => {
  return res.status(200).type('text/html').send(html)
})

export default async function handler(req: any, res: any) {
  await app.ready()
  app.server.emit('request', req, res)
}</code>
    </pre>
    <p>
    <p>
      <a href="https://vercel.com/templates/other/fastify-serverless-function">
      Deploy your own
      </a>
      to get started.
  </body>
</html>
`

// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
  request.log.error(error)
  
  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation
    })
  }

  // Handle JWT errors
  if (error.statusCode === 401) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: error.message
    })
  }

  // Handle Prisma errors
  if (error.code?.startsWith('P')) {
    return reply.status(400).send({
      error: 'Database Error',
      message: error.message
    })
  }

  reply.status(error.statusCode || 500).send({
    error: error.name || 'Internal Server Error',
    message: error.message
  })
})

// Close Prisma when the server shuts down
fastify.addHook('onClose', async () => {
  await prisma.$disconnect()
})

// For local development
if (import.meta.url === `file://${process.argv[1]}`) {
  const start = async () => {
    try {
      await fastify.listen({ 
        port: process.env.PORT || 3001, 
        host: '0.0.0.0' 
      })
      console.log(`Server listening at http://localhost:${process.env.PORT || 3001}`)
      
      httpServer.listen(process.env.WS_PORT || 3002, () => {
        console.log(`WebSocket server listening at ws://localhost:${process.env.WS_PORT || 3002}`)
      })
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  }
  start()
}
export default async (req, res) => {
  await app.ready();
  app.server.emit('request', req, res);
}