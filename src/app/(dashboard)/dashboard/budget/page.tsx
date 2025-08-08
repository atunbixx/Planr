import { redirect } from 'next/navigation'
import { getCurrentUser, requireAuth } from '@/lib/auth/server'
import { createClient } from '@supabase/supabase-js'
import BudgetContent from './components/BudgetContent-srh'
import type { LocaleCode } from '@/lib/localization'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function BudgetPage() {
  const user = await requireAuth()
  const userId = user.id
  
  // Fetch user's budget data
  let budgetData: any = null
  let categories: any[] = []
  let expenses: any[] = []
  let locale = 'en' // Default locale, could be fetched from user preferences
  
  if (user?.email) {
    // Get user's couple data and budget info
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (
          id,
          budget_total,
          budget_categories (
            id,
            name,
            icon,
            color,
            allocatedAmount,
            spentAmount,
            priority,
            industryAveragePercentage
          )
        )
      `)
      .eq('supabaseUserId', user.id)
      .single()
    
    if (userData?.couples?.[0]) {
      const coupleData = userData.couples[0]
      categories = coupleData.budget_categories || []
      
      // Calculate totals
      const totalBudget = Number(coupleData.budget_total) || 0
      const totalSpent = categories.reduce((sum, cat) => sum + (Number(cat.spentAmount) || 0), 0)
      const totalAllocated = categories.reduce((sum, cat) => sum + (Number(cat.allocatedAmount) || 0), 0)
      const remaining = totalBudget - totalSpent
      
      budgetData = {
        totalBudget,
        totalSpent,
        totalAllocated,
        remaining,
        spentPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
      }
      
      // Get recent expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select(`
          *,
          budget_categories (
            name,
            icon,
            color
          ),
          vendors (
            name
          )
        `)
        .eq('coupleId', coupleData.id)
        .order('expense_date', { ascending: false })
        .limit(5)
      
      expenses = expensesData || []
    }
  }

  return (
    <BudgetContent 
      budgetData={budgetData}
      categories={categories}
      expenses={expenses}
      locale={locale as LocaleCode}
    />
  )
}