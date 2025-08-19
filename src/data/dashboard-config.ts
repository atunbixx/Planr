export const TEAM_ROLES: Array<{ key: string; label: string; categories: string[] }> = [
  { key: 'planner', label: 'Planner', categories: ['planner'] },
  { key: 'photographer', label: 'Photographer', categories: ['photographer'] },
  { key: 'florist', label: 'Florist', categories: ['florist'] },
  { key: 'caterer', label: 'Caterer', categories: ['catering', 'caterer'] },
  { key: 'music', label: 'Music/DJ', categories: ['music', 'dj', 'band'] },
  { key: 'makeup', label: 'Makeup', categories: ['makeup', 'beauty'] },
]

export const DEFAULT_CHECKLIST: Array<{ key: string; title: string; hint?: string }> = [
  { key: 'set_date', title: 'Set wedding date' },
  { key: 'choose_venue', title: 'Choose venue' },
  { key: 'create_guest_list', title: 'Create guest list' },
  { key: 'set_budget', title: 'Set budget' },
  { key: 'book_photographer', title: 'Book photographer' },
]

