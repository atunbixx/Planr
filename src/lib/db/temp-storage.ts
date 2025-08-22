// Temporary file-based storage for development when database is not available
import fs from 'fs'
import path from 'path'

const STORAGE_DIR = path.join(process.cwd(), 'temp-data')
const USERS_FILE = path.join(STORAGE_DIR, 'users.json')
const WEDDING_DETAILS_FILE = path.join(STORAGE_DIR, 'wedding-details.json')
const GUESTS_FILE = path.join(STORAGE_DIR, 'guests.json')
const VENDORS_FILE = path.join(STORAGE_DIR, 'vendors.json')
const BUDGETS_FILE = path.join(STORAGE_DIR, 'budgets.json')
const TIMELINE_FILE = path.join(STORAGE_DIR, 'timeline.json')
const SEATING_FILE = path.join(STORAGE_DIR, 'seating.json')
const INQUIRIES_FILE = path.join(STORAGE_DIR, 'inquiries.json')
const PREFERENCES_FILE = path.join(STORAGE_DIR, 'preferences.json')
const TASKS_FILE = path.join(STORAGE_DIR, 'tasks.json')

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

interface UserPreferences {
  userId: string
  currency?: string
  language?: string
  region?: string
  timeZone?: string
  dateFormat?: string
  timeFormat?: string
  createdAt: string
  updatedAt: string
}

interface Guest {
  id: string
  userId: string
  name: string
  rsvpStatus: 'pending' | 'accepted' | 'declined'
  mealPreference?: string
  side?: 'bride' | 'groom'
  invitationSent: boolean
  relationshipCategory?: 'sibling'|'parent'|'relative'|'friend'|'neighbour'|'colleague'|'vendor'|'other'
  tags?: string[]
  createdAt: string
  updatedAt: string
  rsvp?: {
    id: string
    guestId: string
    status: 'pending' | 'accepted' | 'declined'
    dateResponded?: string
    createdAt: string
    updatedAt: string
  }
}

interface Vendor {
  id: string
  userId: string
  name: string
  category: string
  priceRange?: string
  contact?: string
  website?: string
  createdAt: string
  updatedAt: string
  status?: 'inquiry' | 'shortlisted' | 'quoted' | 'booked' | 'contracted' | 'paid'
  rating?: number
  isfavorite?: boolean
  email?: string
  phone?: string
  address?: string
  city?: string
  tags?: string[]
  notes?: string
  quoteamount?: number
  bookeddate?: string
  instagramurl?: string
  logourl?: string
}

interface BudgetItem {
  id: string
  userId: string
  category: string
  amount: number
  allocated: number
  actual: number
  status: 'planned' | 'quoted' | 'booked' | 'paid'
  createdAt: string
  updatedAt: string
}

interface Task {
  id: string
  userId: string
  title: string
  description?: string
  category?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  dueDate?: string
  completedAt?: string
  assignedTo?: string
  isTemplate: boolean
  templateId?: string
  timeline?: string
  order?: number
  tags: string[]
  notes?: string
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
  async getWeddingDetails(userId: string): Promise<WeddingDetails | null> {
    const all = this.readWeddingDetails()
    return all.find(d => d.userId === userId) || null
  }

  private readGuests(): Guest[] {
    this.ensureStorageDir()
    try {
      if (fs.existsSync(GUESTS_FILE)) {
        const data = fs.readFileSync(GUESTS_FILE, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading guests file:', error)
    }
    return []
  }

  private writeGuests(guests: Guest[]) {
    this.ensureStorageDir()
    fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2))
  }

  private readVendors(): Vendor[] {
    this.ensureStorageDir()
    try {
      if (fs.existsSync(VENDORS_FILE)) {
        const data = fs.readFileSync(VENDORS_FILE, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading vendors file:', error)
    }
    return []
  }

  private writeVendors(vendors: Vendor[]) {
    this.ensureStorageDir()
    fs.writeFileSync(VENDORS_FILE, JSON.stringify(vendors, null, 2))
  }

  private readBudgets(): BudgetItem[] {
    this.ensureStorageDir()
    try {
      if (fs.existsSync(BUDGETS_FILE)) {
        const data = fs.readFileSync(BUDGETS_FILE, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading budgets file:', error)
    }
    return []
  }

  private writeBudgets(items: BudgetItem[]) {
    this.ensureStorageDir()
    fs.writeFileSync(BUDGETS_FILE, JSON.stringify(items, null, 2))
  }

  private readTimeline(): any[] {
    this.ensureStorageDir()
    try {
      if (fs.existsSync(TIMELINE_FILE)) {
        const data = fs.readFileSync(TIMELINE_FILE, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading timeline file:', error)
    }
    return []
  }

  private writeTimeline(items: any[]) {
    this.ensureStorageDir()
    fs.writeFileSync(TIMELINE_FILE, JSON.stringify(items, null, 2))
  }

  private readSeating(): any[] {
    this.ensureStorageDir()
    try {
      if (fs.existsSync(SEATING_FILE)) {
        const data = fs.readFileSync(SEATING_FILE, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading seating file:', error)
    }
    return []
  }

  private writeSeating(items: any[]) {
    this.ensureStorageDir()
    fs.writeFileSync(SEATING_FILE, JSON.stringify(items, null, 2))
  }

  private readInquiries(): any[] {
    this.ensureStorageDir()
    try {
      if (fs.existsSync(INQUIRIES_FILE)) {
        const data = fs.readFileSync(INQUIRIES_FILE, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading inquiries file:', error)
    }
    return []
  }

  private writeInquiries(items: any[]) {
    this.ensureStorageDir()
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(items, null, 2))
  }

  private readPreferences(): UserPreferences[] {
    this.ensureStorageDir()
    try {
      if (fs.existsSync(PREFERENCES_FILE)) {
        const data = fs.readFileSync(PREFERENCES_FILE, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error reading preferences file:', error)
    }
    return []
  }

  private writePreferences(items: UserPreferences[]) {
    this.ensureStorageDir()
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(items, null, 2))
  }

  private readTasks(): Task[] {
    try {
      if (fs.existsSync(TASKS_FILE)) {
        return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'))
      }
      return []
    } catch {
      return []
    }
  }

  private writeTasks(tasks: Task[]) {
    this.ensureStorageDir()
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2))
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

  // Preferences operations
  async getPreferences(userId: string): Promise<UserPreferences> {
    const all = this.readPreferences()
    let pref = all.find(p => p.userId === userId)
    if (!pref) {
      pref = {
        userId,
        currency: 'USD',
        language: 'en',
        region: 'US',
        timeZone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      all.push(pref)
      this.writePreferences(all)
    }
    return pref
  }

  async upsertPreferences(userId: string, data: Partial<UserPreferences>): Promise<UserPreferences> {
    const all = this.readPreferences()
    const idx = all.findIndex(p => p.userId === userId)
    if (idx === -1) {
      const pref: UserPreferences = {
        userId,
        currency: data.currency,
        language: data.language,
        region: data.region,
        timeZone: data.timeZone,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      all.push(pref)
      this.writePreferences(all)
      return pref
    }
    const merged: UserPreferences = { ...all[idx], ...data, updatedAt: new Date().toISOString() }
    all[idx] = merged
    this.writePreferences(all)
    return merged
  }

  // Guest operations
  async findGuestsByUserId(userId: string): Promise<Guest[]> {
    const guests = this.readGuests()
    return guests.filter(guest => guest.userId === userId)
  }

  async createGuest(guestData: {
    userId: string
    name: string
    rsvpStatus: 'pending' | 'accepted' | 'declined'
    mealPreference?: string
    side?: 'bride' | 'groom'
    invitationSent: boolean
    relationshipCategory?: Guest['relationshipCategory']
    tags?: string[]
  }): Promise<Guest> {
    const guests = this.readGuests()
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newGuest: Guest = {
      id: guestId,
      ...guestData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rsvp: {
        id: `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        guestId: guestId,
        status: guestData.rsvpStatus,
        dateResponded: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
    
    guests.push(newGuest)
    this.writeGuests(guests)
    return newGuest
  }

  async findGuestById(id: string): Promise<Guest | null> {
    const guests = this.readGuests()
    return guests.find(guest => guest.id === id) || null
  }

  async updateGuest(id: string, updates: Partial<Omit<Guest, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Guest | null> {
    const guests = this.readGuests()
    const guestIndex = guests.findIndex(guest => guest.id === id)
    
    if (guestIndex === -1) return null
    
    guests[guestIndex] = {
      ...guests[guestIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    this.writeGuests(guests)
    return guests[guestIndex]
  }

  async deleteGuest(id: string): Promise<boolean> {
    const guests = this.readGuests()
    const guestIndex = guests.findIndex(guest => guest.id === id)
    
    if (guestIndex === -1) return false
    
    guests.splice(guestIndex, 1)
    this.writeGuests(guests)
    return true
  }

  // Vendor operations (temp fallback)
  async listVendors(userId: string, opts?: { q?: string; category?: string; status?: string; skip?: number; take?: number }) {
    const all = this.readVendors().filter(v => v.userId === userId)
    let filtered = all
    if (opts?.category) filtered = filtered.filter(v => (v.category || '').toLowerCase() === opts.category!.toLowerCase())
    if (opts?.status) filtered = filtered.filter(v => (v.status || '') === opts.status)
    if (opts?.q) {
      const q = opts.q.toLowerCase()
      filtered = filtered.filter(v => (v.name+v.category+(v.contact||'')+(v.notes||'')).toLowerCase().includes(q))
    }
    const total = filtered.length
    const start = opts?.skip || 0
    const end = opts?.take ? start + opts.take : undefined
    return { vendors: filtered.slice(start, end), total }
  }

  async createVendor(userId: string, data: Partial<Vendor>): Promise<Vendor> {
    const vendors = this.readVendors()
    const v: Vendor = {
      id: `vendor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      name: data.name || 'Vendor',
      category: data.category || 'other',
      priceRange: data.priceRange,
      contact: data.contact,
      website: data.website,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: (data.status as any) || 'inquiry',
      rating: typeof data.rating === 'number' ? data.rating : undefined,
      isfavorite: !!data.isfavorite,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      tags: Array.isArray(data.tags) ? data.tags as string[] : [],
      notes: data.notes,
      quoteamount: typeof data.quoteamount === 'number' ? data.quoteamount : undefined,
      bookeddate: data.bookeddate,
      instagramurl: data.instagramurl,
      logourl: data.logourl,
    }
    vendors.push(v)
    this.writeVendors(vendors)
    return v
  }

  async updateVendor(userId: string, id: string, data: Partial<Vendor>): Promise<Vendor | null> {
    const vendors = this.readVendors()
    const idx = vendors.findIndex(v => v.id === id && v.userId === userId)
    if (idx === -1) return null
    vendors[idx] = { ...vendors[idx], ...data, updatedAt: new Date().toISOString() }
    this.writeVendors(vendors)
    return vendors[idx]
  }

  async deleteVendor(userId: string, id: string): Promise<boolean> {
    const vendors = this.readVendors()
    const idx = vendors.findIndex(v => v.id === id && v.userId === userId)
    if (idx === -1) return false
    vendors.splice(idx, 1)
    this.writeVendors(vendors)
    return true
  }

  // Budget operations (temp fallback)
  async listBudgets(userId: string) {
    const items = this.readBudgets().filter(b => b.userId === userId)
    const summary = items.reduce((acc, item) => {
      acc.totalAmount += Number(item.amount)
      acc.totalAllocated += Number(item.allocated)
      acc.totalActual += Number(item.actual)
      return acc
    }, { totalAmount: 0, totalAllocated: 0, totalActual: 0 })
    return { items, summary }
  }

  async createBudget(userId: string, data: Partial<BudgetItem>): Promise<BudgetItem> {
    const items = this.readBudgets()
    const item: BudgetItem = {
      id: `budget_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      category: String(data.category || 'Misc'),
      amount: Number(data.amount || 0),
      allocated: Number(data.allocated || 0),
      actual: Number(data.actual || 0),
      status: (data.status as any) || 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    items.push(item)
    this.writeBudgets(items)
    return item
  }

  async updateBudget(userId: string, id: string, data: Partial<BudgetItem>): Promise<BudgetItem | null> {
    const items = this.readBudgets()
    const idx = items.findIndex(b => b.id === id && b.userId === userId)
    if (idx === -1) return null
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() } as BudgetItem
    this.writeBudgets(items)
    return items[idx]
  }

  async deleteBudget(userId: string, id: string): Promise<boolean> {
    const items = this.readBudgets()
    const idx = items.findIndex(b => b.id === id && b.userId === userId)
    if (idx === -1) return false
    items.splice(idx, 1)
    this.writeBudgets(items)
    return true
  }

  // Timeline operations (temp only)
  async listTimeline(userId: string): Promise<Array<{ id: string; time: string; title: string; description?: string; category?: string; duration?: number; location?: string }>> {
    const all = this.readTimeline()
    return all
      .filter((e: any) => e.userId === userId)
      .map((e: any) => ({
        id: e.id,
        time: e.time,
        title: e.title,
        description: e.description,
        category: e.category,
        duration: typeof e.duration === 'number' ? e.duration : undefined,
        location: e.location,
      }))
  }

  async addTimelineEvent(userId: string, event: { time: string; title: string; description?: string; category?: string; duration?: number; location?: string }) {
    const all = this.readTimeline()
    const item = {
      id: `tl_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      userId,
      time: event.time,
      title: event.title,
      description: event.description,
      category: event.category,
      duration: typeof event.duration === 'number' ? event.duration : undefined,
      location: event.location,
    }
    all.push(item)
    this.writeTimeline(all)
    return item
  }

  async updateTimelineEvent(userId: string, id: string, data: Partial<{ time: string; title: string; description?: string; category?: string; duration?: number; location?: string }>) {
    const all = this.readTimeline()
    const idx = all.findIndex((e: any) => e.id === id && e.userId === userId)
    if (idx === -1) return null
    const prev = all[idx]
    all[idx] = {
      ...prev,
      ...data,
      duration: data.duration !== undefined ? Number(data.duration) : prev.duration,
    }
    this.writeTimeline(all)
    return all[idx]
  }

  async deleteTimelineEvent(userId: string, id: string) {
    const all = this.readTimeline()
    const idx = all.findIndex((e: any) => e.id === id && e.userId === userId)
    if (idx === -1) return false
    all.splice(idx, 1)
    this.writeTimeline(all)
    return true
  }

  // Seating operations (temp only)
  async listSeating(userId: string): Promise<Array<{ id: string; userId: string; name: string; capacity: number; guestIds: string[] }>> {
    const all = this.readSeating()
    return all.filter((t: any) => t.userId === userId)
  }

  async createTable(userId: string, data: { name: string; capacity: number }) {
    const all = this.readSeating()
    const t = { id: `table_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, userId, name: data.name || 'Table', capacity: Math.max(0, Number(data.capacity) || 0), guestIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    all.push(t)
    this.writeSeating(all)
    return t
  }

  async updateTable(userId: string, id: string, data: Partial<{ name: string; capacity: number }>) {
    const all = this.readSeating()
    const idx = all.findIndex((t: any) => t.id === id && t.userId === userId)
    if (idx === -1) return null
    const table = all[idx]
    const capacity = data.capacity !== undefined ? Math.max(0, Number(data.capacity) || 0) : table.capacity
    if (capacity < table.guestIds.length) {
      // trim extra assignments from end
      table.guestIds = table.guestIds.slice(0, capacity)
    }
    all[idx] = { ...table, name: data.name ?? table.name, capacity, updatedAt: new Date().toISOString() }
    this.writeSeating(all)
    return all[idx]
  }

  async deleteTable(userId: string, id: string) {
    const all = this.readSeating()
    const idx = all.findIndex((t: any) => t.id === id && t.userId === userId)
    if (idx === -1) return false
    all.splice(idx, 1)
    this.writeSeating(all)
    return true
  }

  async assignGuests(userId: string, tableId: string, guestIds: string[]) {
    const all = this.readSeating()
    const tables = all.filter((t: any) => t.userId === userId)
    const table = tables.find((t: any) => t.id === tableId)
    if (!table) return null
    // remove guests from any other table
    for (const t of tables) {
      t.guestIds = (t.guestIds || []).filter((id: string) => !guestIds.includes(id))
    }
    // add to target up to capacity
    const remainingCapacity = Math.max(0, table.capacity - table.guestIds.length)
    const toAdd = guestIds.slice(0, remainingCapacity)
    table.guestIds = [...(table.guestIds || []), ...toAdd]
    this.writeSeating(all)
    return table
  }

  async unassignGuest(userId: string, guestId: string) {
    const all = this.readSeating()
    const tables = all.filter((t: any) => t.userId === userId)
    let changed = false
    for (const t of tables) {
      const before = t.guestIds.length
      t.guestIds = (t.guestIds || []).filter((id: string) => id !== guestId)
      if (t.guestIds.length !== before) changed = true
    }
    if (changed) this.writeSeating(all)
    return changed
  }

  async autoAssign(userId: string, allGuestIds: string[], groupByRelationship: boolean) {
    // naive greedy assign: fill tables in order; if groupBy, cluster guestIds by relationship
    const tables = this.readSeating().filter((t: any) => t.userId === userId)
    // clear all assignments
    for (const t of tables) t.guestIds = []
    // derive order
    let buckets: string[][] = [allGuestIds]
    if (groupByRelationship) {
      // we need relationships; read guests from file
      const guests = this.readGuests().filter(g => g.userId === userId)
      const byRel: Record<string, string[]> = {}
      for (const g of guests) {
        const key = (g as any).relationshipCategory || 'other'
        if (!byRel[key]) byRel[key] = []
        if (allGuestIds.includes(g.id)) byRel[key].push(g.id)
      }
      buckets = Object.values(byRel)
    }
    // round-robin fill tables by bucket
    let tIndex = 0
    for (const bucket of buckets) {
      for (const gid of bucket) {
        let placed = false
        for (let tries = 0; tries < tables.length; tries++) {
          const t = tables[tIndex % tables.length]
          tIndex++
          if (t.guestIds.length < t.capacity) {
            t.guestIds.push(gid)
            placed = true
            break
          }
        }
        if (!placed) break
      }
    }
    const all = this.readSeating()
    // write back updated user tables
    for (let i = 0; i < all.length; i++) {
      if (all[i].userId === userId) {
        const updated = tables.find((t: any) => t.id === all[i].id)
        if (updated) all[i] = { ...all[i], guestIds: updated.guestIds, updatedAt: new Date().toISOString() }
      }
    }
    this.writeSeating(all)
    return tables
  }

  // Public directory inquiries (temp only)
  async addDirectoryInquiry(data: { vendorId: string; name: string; email: string; phone?: string; message: string; eventDate?: string; budget?: number }) {
    const all = this.readInquiries()
    const item = {
      id: `inq_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'public'
    }
    all.push(item)
    this.writeInquiries(all)
    return item
  }

  // Task operations
  async findTasksByUserId(userId: string): Promise<Task[]> {
    const tasks = this.readTasks()
    return tasks.filter(task => task.userId === userId)
  }

  async findTaskById(id: string): Promise<Task | null> {
    const tasks = this.readTasks()
    return tasks.find(task => task.id === id) || null
  }

  async createTask(data: {
    userId: string
    title: string
    description?: string
    category?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
    dueDate?: string
    assignedTo?: string
    timeline?: string
    order?: number
    tags?: string[]
    notes?: string
  }): Promise<Task> {
    const tasks = this.readTasks()
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate,
      assignedTo: data.assignedTo,
      isTemplate: false,
      timeline: data.timeline,
      order: data.order,
      tags: data.tags || [],
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    tasks.push(task)
    this.writeTasks(tasks)
    return task
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
    const tasks = this.readTasks()
    const index = tasks.findIndex(task => task.id === id)
    if (index === -1) return null

    const updatedTask = {
      ...tasks[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    tasks[index] = updatedTask
    this.writeTasks(tasks)
    return updatedTask
  }

  async deleteTask(id: string): Promise<boolean> {
    const tasks = this.readTasks()
    const index = tasks.findIndex(task => task.id === id)
    if (index === -1) return false

    tasks.splice(index, 1)
    this.writeTasks(tasks)
    return true
  }

  // Enhanced seating operations for new Table/Seat models
  async findTableById(tableId: string): Promise<any | null> {
    const tables = this.readSeating()
    return tables.find(table => table.id === tableId) || null
  }

  async createSeatsForTable(tableId: string, capacity: number): Promise<any[]> {
    const seats = []
    for (let i = 1; i <= capacity; i++) {
      seats.push({
        id: `seat_${tableId}_${i}_${Date.now()}`,
        tableId,
        guestId: null,
        seatNumber: i,
        positionX: 0,
        positionY: 0,
        isHost: false,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    return seats
  }

  async assignGuestToSeat(seatId: string, guestId: string | null, notes?: string): Promise<any> {
    return {
      id: seatId,
      guestId,
      notes: notes || null,
      updatedAt: new Date().toISOString()
    }
  }

  async bulkAssignGuests(assignments: Array<{ seatId: string; guestId: string | null }>): Promise<any[]> {
    return assignments.map(assignment => ({
      id: assignment.seatId,
      guestId: assignment.guestId,
      updatedAt: new Date().toISOString()
    }))
  }

  async getSeatingStats(userId: string): Promise<{
    totalTables: number
    totalSeats: number
    assignedSeats: number
    unassignedSeats: number
    totalGuests: number
    seatedGuests: number
    unseatedGuests: number
  }> {
    const tables = this.readSeating().filter(t => t.userId === userId)
    const guests = this.readGuests().filter(g => g.userId === userId)
    
    const totalTables = tables.length
    const totalSeats = tables.reduce((sum, table) => sum + table.capacity, 0)
    const assignedSeats = tables.reduce((sum, table) => sum + (table.guestIds?.length || 0), 0)
    
    return {
      totalTables,
      totalSeats,
      assignedSeats,
      unassignedSeats: totalSeats - assignedSeats,
      totalGuests: guests.length,
      seatedGuests: assignedSeats,
      unseatedGuests: guests.length - assignedSeats
    }
  }

  // Task assignment operations
  async listTaskAssignments(filters?: any): Promise<any[]> {
    // Placeholder implementation for temp storage
    return []
  }

  async findTaskAssignment(taskId: string, assigneeId: string): Promise<any | null> {
    // Placeholder implementation for temp storage
    return null
  }

  async createTaskAssignment(data: any): Promise<any> {
    // Placeholder implementation for temp storage
    return {
      id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId: data.taskId,
      assigneeId: data.assigneeId,
      assignedBy: data.assignedBy,
      status: 'pending',
      notes: data.notes || null,
      dueDate: data.dueDate || null,
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  async bulkAssignTasks(data: any): Promise<any[]> {
    // Placeholder implementation for temp storage
    return data.taskIds.map((taskId: string) => ({
      id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      assigneeId: data.assigneeId,
      assignedBy: data.assignedBy,
      status: 'pending',
      notes: data.notes || null,
      dueDate: data.dueDate || null,
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  async updateTaskAssignment(taskId: string, assigneeId: string, data: any): Promise<any | null> {
    // Placeholder implementation for temp storage
    return {
      id: `assignment_${taskId}_${assigneeId}`,
      taskId,
      assigneeId,
      assignedBy: data.updatedBy,
      status: data.status || 'pending',
      notes: data.notes || null,
      dueDate: data.dueDate || null,
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  async unassignTask(taskId: string, assigneeId: string): Promise<boolean> {
    // Placeholder implementation for temp storage
    return true
  }

  async getTaskAssignmentStats(userId?: string): Promise<{
    totalAssignments: number
    assignmentsByStatus: Record<string, number>
    assignmentsByPriority: Record<string, number>
    overdueTasks: number
    completionRate: number
  }> {
    // Placeholder implementation for temp storage
    return {
      totalAssignments: 0,
      assignmentsByStatus: {
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        on_hold: 0
      },
      assignmentsByPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      },
      overdueTasks: 0,
      completionRate: 0
    }
  }
}

export const tempStorage = new TempStorage()
