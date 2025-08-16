// Temporary file-based storage for development when database is not available
import fs from 'fs'
import path from 'path'

const STORAGE_DIR = path.join(process.cwd(), 'temp-data')
const USERS_FILE = path.join(STORAGE_DIR, 'users.json')
const WEDDING_DETAILS_FILE = path.join(STORAGE_DIR, 'wedding-details.json')

interface User {
  id: string
  email: string
  password: string
  role: string
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

interface WeddingDetails {
  userId: string
  venue?: string
  weddingDate?: string
  budget?: number
  guestCount?: number
  createdAt: string
  updatedAt: string
}

class TempStorage {
  private ensureStorageDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true })
    }
  }

  private readUsers(): User[] {
    this.ensureStorageDir()
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading users file:', error)
    }
    return []
  }

  private writeUsers(users: User[]) {
    this.ensureStorageDir()
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
  }

  private readWeddingDetails(): WeddingDetails[] {
    this.ensureStorageDir()
    try {
      if (fs.existsSync(WEDDING_DETAILS_FILE)) {
        const data = fs.readFileSync(WEDDING_DETAILS_FILE, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading wedding details file:', error)
    }
    return []
  }

  private writeWeddingDetails(details: WeddingDetails[]) {
    this.ensureStorageDir()
    fs.writeFileSync(WEDDING_DETAILS_FILE, JSON.stringify(details, null, 2))
  }

  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    const users = this.readUsers()
    return users.find(user => user.email === email) || null
  }

  async findUserById(id: string): Promise<User | null> {
    const users = this.readUsers()
    return users.find(user => user.id === id) || null
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const users = this.readUsers()
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    users.push(newUser)
    this.writeUsers(users)
    return newUser
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = this.readUsers()
    const userIndex = users.findIndex(user => user.id === id)
    
    if (userIndex === -1) return null
    
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    this.writeUsers(users)
    return users[userIndex]
  }

  // Wedding details operations
  async createOrUpdateWeddingDetails(userId: string, details: Omit<WeddingDetails, 'userId' | 'createdAt' | 'updatedAt'>): Promise<WeddingDetails> {
    const allDetails = this.readWeddingDetails()
    const existingIndex = allDetails.findIndex(d => d.userId === userId)
    
    const weddingDetails: WeddingDetails = {
      userId,
      ...details,
      createdAt: existingIndex >= 0 ? allDetails[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (existingIndex >= 0) {
      allDetails[existingIndex] = weddingDetails
    } else {
      allDetails.push(weddingDetails)
    }
    
    this.writeWeddingDetails(allDetails)
    return weddingDetails
  }
}

export const tempStorage = new TempStorage()