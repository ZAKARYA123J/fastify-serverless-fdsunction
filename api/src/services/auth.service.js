import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class AuthService {
  static async hashPassword(password) {
    return bcrypt.hash(password, 10)
  }

  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash)
  }

  static formatUserResponse(user) {
    const { password: _, ...userBase } = user
    const roleData = user[user.role.toLowerCase()]
    
    return {
      ...userBase,
      profile: roleData
    }
  }

  static async register(userData) {
    const hashedPassword = await this.hashPassword(userData.password)
    
    const roleData = {
      name: userData.name,
    
      ...(userData.role === 'COCHE' && {
        experience: userData.experience,
      }),
      ...(userData.role === 'STAFF' && {
        nationality: userData.nationality,
      }),
      ...(userData.role === 'ADMIN' && {
        name: userData.name
      })
    }
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        [userData.role.toLowerCase()]: {
          create: roleData
        }
      },
      include: {
        coche: true,
        staff: true,
        admin: true,
      },
    })

    return this.formatUserResponse(user)
  }

  static async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        coche: true,
        staff: true,
        admin: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const validPassword = await this.verifyPassword(password, user.password)
    if (!validPassword) {
      throw new Error('Invalid password')
    }

    return this.formatUserResponse(user)
  }
}