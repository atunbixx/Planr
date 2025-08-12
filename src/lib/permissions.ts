import { prisma } from '@/lib/prisma'

export type Permission = 
  | 'view'
  | 'edit'
  | 'manage_guests'
  | 'edit_guests'
  | 'manage_budget'
  | 'view_budget'
  | 'manage_vendors'
  | 'view_schedule'
  | 'manage_tasks'
  | 'manage_photos'
  | 'view_photos'
  | 'manage_own_vendor'

export async function checkUserPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  try {
    // First check if user is the owner (couple)
    const couple = await prisma.couple.findUnique({
      where: { userId: userId }
    })

    if (couple) {
      // Owners have all permissions
      return true
    }

    // Check if user is a wedding couple owner
    const weddingCouple = await prisma.couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: userId },
          { partner2_user_id: userId }
        ]
      }
    })

    if (weddingCouple) {
      // Wedding couple owners have all permissions
      return true
    }

    // Check collaborator permissions
    const collaborator = await prisma.couple_collaborators.findFirst({
      where: {
        userId: userId,
        status: 'accepted'
      }
    })

    if (!collaborator) {
      return false
    }

    // Check if the collaborator has the required permission
    return collaborator.permissions.includes(permission) || collaborator.permissions.includes('edit')
  } catch (error) {
    console.error('Error checking permissions:', error)
    return false
  }
}

export async function getUserRole(userId: string): Promise<string | null> {
  try {
    // Check if user is the owner
    const couple = await prisma.couple.findUnique({
      where: { userId: userId }
    })

    if (couple) {
      return 'owner'
    }

    // Check collaborator role
    const collaborator = await prisma.couple_collaborators.findFirst({
      where: {
        userId: userId,
        status: 'accepted'
      }
    })

    return collaborator?.role || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

export async function getCoupleIdForUser(userId: string): Promise<string | null> {
  try {
    // Check if user is the owner via couples table
    const couple = await prisma.couple.findUnique({
      where: { userId: userId }
    })

    if (couple) {
      // Find the couples record
      const weddingCouple = await prisma.couples.findFirst({
        where: {
          OR: [
            { partner1_user_id: userId },
            { partner2_user_id: userId }
          ]
        }
      })
      return weddingCouple?.id || null
    }

    // Check if user is a collaborator
    const collaborator = await prisma.couple_collaborators.findFirst({
      where: {
        userId: userId,
        status: 'accepted'
      }
    })

    return collaborator?.coupleId || null
  } catch (error) {
    console.error('Error getting couple ID:', error)
    return null
  }
}