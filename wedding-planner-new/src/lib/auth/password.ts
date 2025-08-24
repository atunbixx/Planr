import bcrypt from 'bcryptjs'

export class PasswordService {
  private static readonly saltRounds = 12

  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds)
      return await bcrypt.hash(password, salt)
    } catch (_) {
      throw new Error('Failed to hash password')
    }
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword)
    } catch (_) {
      throw new Error('Failed to verify password')
    }
  }

  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}