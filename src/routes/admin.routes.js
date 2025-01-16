import { AdminService } from '../services/admin.service.js'
import { checkRole } from '../middleware/auth.middleware.js'
import { group } from 'console'
console.log("admin routes")
export async function adminRoutes(fastify) {
  // Get all users
  fastify.get('/', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              email: { type: 'string' },
              role: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const users = await AdminService.getAllUsers()
        return users
      } catch (error) {
        reply.code(500).send({ error: error.message })
      }
    }
  })
  // Get user by ID
  fastify.get('/users/:id', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const id = parseInt(request.params.id)
        if (isNaN(id)) {
          reply.code(400).send({ error: 'Invalid user ID' })
          return
        }

        const user = await AdminService.getUserById(id)
        if (!user) {
          reply.code(404).send({ error: 'User not found' })
          return
        }
        return user
      } catch (error) {
        if (error.code === 'P2001') {
          reply.code(404).send({ error: 'User not found' })
        } else {
          reply.code(500).send({ error: error.message })
        }
      }
    }
  })
  // Update user
  fastify.put('/:id', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string' },
          nationality: { type: 'string' },
          age: { type: 'integer' },
          contactInfo: { type: 'string' },
          specialization: { type: 'string' },
          availability: { type: 'boolean' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const updatedUser = await AdminService.updateUser(request.params.id, request.body)
        return updatedUser
      } catch (error) {
        reply.code(400).send({ error: error.message })
      }
    }
  })
  // Get all staffs
  fastify.get('/staff', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    handler: async (request, reply) => {
      try {
        const staffs = await AdminService.getAllStaff()
        return staffs
      } catch (error) {
        reply.code(500).send({ error: error.message })
      }
    }
  })

  // Get all players

  // Get all coches
  fastify.get('/coches', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    handler: async (request, reply) => {
      try {
        const patients = await AdminService.getAllcoches()
        return patients
      } catch (error) {
        reply.code(500).send({ error: error.message })
      }
    }
  })
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const result = await AdminService.deleteUser(request.params.id)
        return result
      } catch (error) {
        reply.code(400).send({ error: error.message })
      }
    }
  })
  
   fastify.post("/group",
    {
      onRequest: [fastify.authenticate, checkRole(["ADMIN"])],
      schema: {
        body: {
          type: "object",
          required: ["name", "cocheId", "minAge", "maxAge"],
          properties: {
            name: { type: "string" },
            cocheId: { type: "integer" }, // Correct type
            minAge: { type: "integer" }, // Correct type
            maxAge: { type: "integer" }  // Correct type
          }
        }
      },
      handler: async (request, reply) => {
        try {
          const group = await AdminService.createGroup(request.body);
          return group;
        } catch (error) {
          reply.code(400).send({ error: error.message });
        }
      }
    }
  );
  fastify.get('/group', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    handler: async (request, reply) => {
      try {
        const group = await AdminService.getGroups()
        return group
      } catch (error) {
        reply.code(500).send({ error: error.message })
      }
    }
  })
  fastify.get('/group/:id', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const group = await AdminService.getGroupById(request.params.id)
        return group
      } catch (error) {
        reply.code(500).send({ error: error.message })
      }
    }
  })
  fastify.delete('/group/:id', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const result = await AdminService.deleteGroup(request.params.id)
        return result
      } catch (error) {
        reply.code(400).send({ error: error.message })
      }
    }
  })
  fastify.put('/group/:id', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: "string" },
          cocheId: { type: "integer" }, // Correct type
          minAge: { type: "integer" }, // Correct type
          maxAge: { type: "integer" }  // Correct type
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const updatedGroup = await AdminService.updateGroup(request.params.id, request.body)
        return updatedGroup
      } catch (error) {
        reply.code(400).send({ error: error.message })
      }
    }
  })
 
  fastify.get('/players', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    handler: async (request, reply) => {
      try {
        const patients = await AdminService.getPlayers()
        return patients
      } catch (error) {
        reply.code(500).send({ error: error.message })
      }
    }
  })
  fastify.get("/players/:id", {
    onRequest: [fastify.authenticate, checkRole(["ADMIN"])],
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const player = await AdminService.getPlayerById(request.params.id);
        return player;
      } catch (error) {
        reply.code(500).send({ error: error.message });
      }
    }
  });
  fastify.delete('/players/:id', {
    onRequest: [fastify.authenticate, checkRole(['ADMIN'])],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const result = await AdminService.deletePlayer(request.params.id)
        return result
      } catch (error) {
        reply.code(400).send({ error: error.message })
      }
    }
  })
  fastify.put("/players/:id", {
    onRequest: [fastify.authenticate, checkRole(["ADMIN"])],
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
          position: { type: "string" },
          team: { type: "string" }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const updatedPlayer = await AdminService.updatePlayer(
          request.params.id,
          request.body
        );
        return updatedPlayer;
      } catch (error) {
        reply.code(400).send({ error: error.message });
      }
    }
  });
  fastify.post("/players", {
    onRequest: [fastify.authenticate, checkRole(["ADMIN"])],
    schema: {
      body: {
        type: "object",
        required: ["name", "age", "position","groupId","nationality","contactInfo"],
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
          position: { type: "string" },
          team: { type: "string" },
          groupId: { type: "integer" },
          nationality: { type: "string" },
          age: { type: "integer" },
          contactInfo: { type: "string" }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const player = await AdminService.createPlayer(request.body);
        return player;
      } catch (error) {
        reply.code(400).send({ error: error.message });
      }
    }
  })
}