import { prisma } from '@/lib/prisma'
import { User, Prisma } from '@prisma/client'
import { BaseRepository } from './BaseRepository'

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('user')
  }
  async findById(id: string): Promise<User | null> {
    return this.executeQueryWithCache(
      `user:id:${id}`,
      () => prisma.user.findUnique({ where: { id } }),
      { cacheType: 'user', tags: ['user', `user:${id}`] }
    )
  }

  async findBySupabaseUserId(supabaseUserId: string): Promise<User | null> {
    return this.executeQueryWithCache(
      `user:supabase:${supabaseUserId}`,
      () => prisma.user.findUnique({ where: { supabaseUserId } }),
      { cacheType: 'user', tags: ['user', `user:supabase:${supabaseUserId}`] }
    )
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.executeQueryWithCache(
      `user:email:${email}`,
      () => prisma.user.findUnique({ where: { email } }),
      { cacheType: 'user', tags: ['user', `user:email:${email}`] }
    )
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.createWithCache(
      () => prisma.user.create({ data }),
      ['user', 'user:all']
    )
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.updateWithCache(
      () => prisma.user.update({ where: { id }, data }),
      ['user', `user:${id}`, 'user:all']
    )
  }

  async delete(id: string): Promise<User> {
    return this.deleteWithCache(
      () => prisma.user.delete({ where: { id } }),
      ['user', `user:${id}`, 'user:all']
    )
  }

  async findWithCouple(supabaseUserId: string): Promise<User & { couples?: any[] } | null> {
    return this.executeQueryWithCache(
      `user:withCouple:${supabaseUserId}`,
      () => prisma.user.findUnique({
        where: { supabaseUserId },
        include: { couples: true }
      }),
      { cacheType: 'user', tags: ['user', 'couple', `user:supabase:${supabaseUserId}`] }
    )
  }
}