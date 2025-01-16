import { PrismaClient } from '@prisma/client'
import { AuthService } from './auth.service.js'
import { group } from 'console'
import { availableMemory } from 'process'

const prisma = new PrismaClient()

export class AdminService {
  static async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
       
        staff: {
          select: {
            name: true
          }
        },
        coche: {
          select: {
            name: true,
            specialization: true,
            availability: true,
          }
        },
        admin: {
          select: {
           
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return users.map(user => {
      // Get the role-specific data
      const roleData = user[user.role.toLowerCase()]
      // Remove all role fields
      const {  staff, coche, admin, ...baseUser } = user
      // Return combined data
      return {
        ...baseUser,
        ...roleData
      }
    })
  }

  static async getAllcoches() {
    const coches = await prisma.coche.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        },
        groups: {
          include: {
            Players: {
              select: {
                name: true,
                nationality: true,
                age: true,
              }
            }
          }
        }
      }
    })

    return coches.map(coche => ({
      id: coche.id,
      userId: coche.userId,
      name: coche.name,
      specialization: coche.specialization,
      availability: coche.availability,
  
      email: coche.user.email,
      role: coche.user.role,
      createdAt: coche.user.createdAt,
      updatedAt: coche.user.updatedAt,
      group: coche.groups.length,
    }))
  }
  static async getAllStaff() {
    const staffs = await prisma.staff.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    return staffs.map(staff => ({
      id: staff.id,
      userId: staff.userId,
      name: staff.name,
      email: staff.user.email,
      role: staff.user.role,
      createdAt: staff.user.createdAt,
      updatedAt: staff.user.updatedAt
    }))
  }

 
  static async getUserById(id) {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('Invalid user ID')
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        staff: {
          select: {
            name: true,
            nationality: true,
            contactInfo: true,
            age: true,
          }
        },
        coche: {
          select: {
            id: true,
            name: true,
           
          }
        },
        admin: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!user) {
      const error = new Error('User not found')
      error.code = 'P2001'
      throw error
    }

    // Get the role-specific data
    const roleSpecificData = user[user.role.toLowerCase()]
    // Remove all role fields
    const {  staff, coche, admin, ...baseUser } = user
    // Return combined data
    return {
      ...baseUser,
      ...roleSpecificData
    }
  }
  static async updateUser(id, userData) {
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        staff: true,
        coche: true,
        admin: true
      }
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    // Prepare update data
    const updateData = {
      email: userData.email,
      ...(userData.password && {
        password: await AuthService.hashPassword(userData.password)
      })
    }

    // Prepare role-specific update
    const roleModel = existingUser.role.toLowerCase()
    const roleUpdateData = {
      name: userData.name,
      ...(roleModel === 'coche' && {
        specialization: userData.specialization
      }),
      ...(roleModel === 'staff' && {
        availability: userData.availability
      })
    }

    // Update both user and role data
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        [roleModel]: {
          update: roleUpdateData
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
       
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        coche: {
          select: {
            id: true,
            name: true,
            specialization: true,
            availability: true,
            experience: true,
            contactInfo: true,
          }
        },
        admin: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Get the role-specific data
    const roleSpecificData = updatedUser[updatedUser.role.toLowerCase()]
    // Remove all role fields
    const {  staff, coche, admin, ...baseUser } = updatedUser
    // Return combined data
    return {
      ...baseUser,
      ...roleSpecificData
    }
  }
  static async deleteUser(id) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Delete the user (this will cascade delete role-specific data)
    await prisma.user.delete({
      where: { id: parseInt(id) }
    })

    return { message: 'User deleted successfully' }
  }

  static async createGroup(data) {
    const group = await prisma.group.create({
      data: {
        name: data.name,
        minAge:data.minAge,
        maxAge:data.maxAge,
        cocheId: data.cocheId,
        Players: {
          create: data.Players
        }
      }
    })
    return group
  }
  static async getGroupById(id) {
    const group = await prisma.group.findUnique({
      where: { id: parseInt(id) },
      include: {
        coche: true,
        Players: true
      }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    return group
  }
  static async updateGroup(id, data) {  
    const group = await prisma.group.findUnique({
      where: { id: parseInt(id) }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    return prisma.group.update({
      where: { id: parseInt(id) },
      data
    })
  }
  static async deleteGroup(id) {    
    const group = await prisma.group.findUnique({
      where: { id: parseInt(id) }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    return prisma.group.delete({
      where: { id: parseInt(id) }
    })
  }
  static async getGroups() {
    return prisma.group.findMany({
      include: {
        coche: true,
        Players: true
      }
    })
  }

  static async getGroupPlayers(groupId) {
    const group = await prisma.group.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        Players: true
      }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    return group.Players
  }
  static async getPlayers() {
    const players = await prisma.player.findMany()

    return players.map(player => ({
      id: player.id,
      userId: player.id,
      name: player.name,
      nationality: player.nationality,
      age: player.age,
      contactInfo: player.contactInfo,   
      position: player.position,
      email: player.user.email,
      createdAt: player.user.createdAt,
      updatedAt: player.user.updatedAt,
    }))
  }
  static async addPlayerToGroup(groupId, playerId) {
    const group = await prisma.group.findUnique({
      where: { id: parseInt(groupId) }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    return prisma.group.update({
      where: { id: parseInt(groupId) },
      data: {
        Players: {
          connect: { id: parseInt(playerId) }
        }
      }
    })
  }
  static async removePlayerFromGroup(groupId, playerId) {
    const group = await prisma.group.findUnique({
      where: { id: parseInt(groupId) }
    })

    if (!group) {
      throw new Error('Group not found')
    }

    return prisma.group.update({
      where: { id: parseInt(groupId) },
      data: {
        Players: {
          disconnect: { id: parseInt(playerId) }
        }
      }
    })
  }
  static async getPlayerById(id) {
    const player = await prisma.player.findUnique({
      where: { id: parseInt(id) }
    })

    if (!player) {
      throw new Error('Player not found')
    }

    return player
  }
  static async createPlayer(data) {
    const player = await prisma.player.create({
      data: {
        name: data.name,
        nationality: data.nationality,
        age: data.age,
        contactInfo: data.contactInfo,
        position: data.position,
        groupId: data.groupId
      }
    })

    return player
  }
}
