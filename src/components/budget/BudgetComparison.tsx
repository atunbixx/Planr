'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/utils/cn'
import { BudgetCategory } from '@/hooks/useBudget'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

interface BudgetComparisonProps {
  categories: BudgetCategory[]
  industryAverages?: Record<string, number>
}

const DEFAULT_INDUSTRY_AVERAGES: Record<string, number> = {
  'Venue & Reception': 30,
  'Catering & Bar': 20,
  'Photography & Videography': 10,
  'Wedding Attire': 5,
  'Flowers & Decorations': 8,
  'Music & Entertainment': 5,
  'Transportation': 2,
  'Wedding Cake': 2,
  'Invitations & Stationery': 2,
  'Rings': 8,
  'Beauty & Wellness': 3,
  'Miscellaneous': 5
}

export function BudgetComparison({ 
  categories, 
  industryAverages = DEFAULT_INDUSTRY_AVERAGES 
}: BudgetComparisonProps) {
  const [viewMode, setViewMode] = useState<'bar' | 'radar' | 'table'>('bar')
  
  // Calculate total budget
  const totalBudget = categories.reduce((sum, cat) => sum + cat.allocated_amount, 0)
  
  // Prepare comparison data
  const comparisonData = categories.map(category => {
    const allocatedPercentage = totalBudget > 0 ? (category.allocated_amount / totalBudget) * 100 : 0
    const industryAverage = industryAverages[category.name] || 5
    const difference = allocatedPercentage - industryAverage
    const spentPercentage = category.allocated_amount > 0 ? (category.spent_amount / category.allocated_amount) * 100 : 0
    
    return {
      name: category.name,
      allocated: allocatedPercentage,
      industry: industryAverage,
      difference,
      spent: spentPercentage,
      allocatedAmount: category.allocated_amount,
      spentAmount: category.spent_amount,
      isOverIndustry: allocatedPercentage > industryAverage,
      isOverBudget: category.spent_amount > category.allocated_amount
    }
  }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))

  // Calculate insights
  const overIndustryCategories = comparisonData.filter(item => item.isOverIndustry)
  const underIndustryCategories = comparisonData.filter(item => !item.isOverIndustry)
  const overBudgetCategories = comparisonData.filter(item => item.isOverBudget)
  
  const totalDifferenceFromIndustry = comparisonData.reduce((sum, item) => sum + Math.abs(item.difference), 0)
  const averageDifference = totalDifferenceFromIndustry / comparisonData.length

  // Colors for charts
  const COLORS = {
    allocated: '#10B981',
    industry: '#3B82F6',
    overBudget: '#EF4444',
    underBudget: '#10B981',
    neutral: '#6B7280'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Alignment</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(100 - averageDifference).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Match with industry standards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Over Industry</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overIndustryCategories.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Categories above average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Industry</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {underIndustryCategories.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Categories below average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overBudgetCategories.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Categories overspent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={viewMode === 'bar' ? 'default' : 'outline'}
          onClick={() => setViewMode('bar')}
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Bar Chart
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'radar' ? 'default' : 'outline'}
          onClick={() => setViewMode('radar')}
        >
          <PieChart className="h-4 w-4 mr-1" />
          Radar Chart
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'table' ? 'default' : 'outline'}
          onClick={() => setViewMode('table')}
        >
          <Info className="h-4 w-4 mr-1" />
          Detailed View
        </Button>
      </div>

      {/* Charts */}
      {viewMode === 'bar' && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation vs Industry Average</CardTitle>
            <CardDescription>Compare your budget distribution with typical wedding budgets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis 
                  label={{ value: 'Percentage of Total Budget', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Bar dataKey="allocated" fill={COLORS.allocated} name="Your Budget" />
                <Bar dataKey="industry" fill={COLORS.industry} name="Industry Average" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {viewMode === 'radar' && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Distribution Radar</CardTitle>
            <CardDescription>Visual comparison of budget allocation patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={comparisonData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" fontSize={12} />
                <PolarRadiusAxis angle={90} domain={[0, 40]} />
                <Radar 
                  name="Your Budget" 
                  dataKey="allocated" 
                  stroke={COLORS.allocated}
                  fill={COLORS.allocated}
                  fillOpacity={0.3}
                />
                <Radar 
                  name="Industry Average" 
                  dataKey="industry" 
                  stroke={COLORS.industry}
                  fill={COLORS.industry}
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Budget Comparison</CardTitle>
            <CardDescription>Category-by-category breakdown with insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonData.map(item => {
                const differenceAbs = Math.abs(item.difference)
                const isDifferenceSignificant = differenceAbs > 5

                return (
                  <div key={item.name} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          ${item.allocatedAmount.toLocaleString()} allocated • ${item.spentAmount.toLocaleString()} spent
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isOverBudget && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Over Budget
                          </span>
                        )}
                        {isDifferenceSignificant && (
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            item.isOverIndustry 
                              ? "bg-orange-100 text-orange-700" 
                              : "bg-blue-100 text-blue-700"
                          )}>
                            {item.isOverIndustry ? 'Above' : 'Below'} Industry
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Your Allocation</p>
                        <p className="font-semibold">{item.allocated.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Industry Average</p>
                        <p className="font-semibold">{item.industry}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Difference</p>
                        <p className={cn(
                          "font-semibold",
                          item.isOverIndustry ? "text-orange-600" : "text-blue-600"
                        )}>
                          {item.isOverIndustry ? '+' : ''}{item.difference.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Budget Usage</span>
                        <span className={cn(
                          "font-medium",
                          item.spent > 100 ? "text-red-600" : 
                          item.spent > 80 ? "text-orange-600" : 
                          "text-green-600"
                        )}>
                          {item.spent.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(item.spent, 100)} 
                        className={cn(
                          "h-2",
                          item.spent > 100 ? "[&>div]:bg-red-500" :
                          item.spent > 80 ? "[&>div]:bg-orange-500" :
                          "[&>div]:bg-green-500"
                        )}
                      />
                    </div>

                    {isDifferenceSignificant && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600">
                          {item.isOverIndustry ? (
                            <>
                              <AlertTriangle className="inline h-4 w-4 text-orange-600 mr-1" />
                              This category is {differenceAbs.toFixed(0)}% higher than typical weddings. 
                              Consider if this aligns with your priorities.
                            </>
                          ) : (
                            <>
                              <Info className="inline h-4 w-4 text-blue-600 mr-1" />
                              This category is {differenceAbs.toFixed(0)}% lower than typical weddings. 
                              You may have room to allocate more if needed.
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {overBudgetCategories.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">Overspent Categories</h4>
              <p className="text-sm text-red-700 mb-2">
                {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'category is' : 'categories are'} over budget:
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                {overBudgetCategories.map(cat => (
                  <li key={cat.name}>
                    • {cat.name}: ${Math.abs(cat.allocatedAmount - cat.spentAmount).toLocaleString()} over
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overIndustryCategories.length > 0 && (
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">Above Industry Average</h4>
              <p className="text-sm text-orange-700">
                Consider reviewing these categories to ensure they align with your priorities:
              </p>
              <ul className="text-sm text-orange-700 mt-2 space-y-1">
                {overIndustryCategories.slice(0, 3).map(cat => (
                  <li key={cat.name}>
                    • {cat.name}: {cat.difference.toFixed(0)}% above average
                  </li>
                ))}
              </ul>
            </div>
          )}

          {underIndustryCategories.filter(cat => cat.difference < -10).length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Potential Opportunities</h4>
              <p className="text-sm text-blue-700">
                These categories are significantly below industry average. You may want to consider increasing allocation if they're important to you:
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                {underIndustryCategories
                  .filter(cat => cat.difference < -10)
                  .slice(0, 3)
                  .map(cat => (
                    <li key={cat.name}>
                      • {cat.name}: {Math.abs(cat.difference).toFixed(0)}% below average
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {averageDifference < 10 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Well-Balanced Budget</h4>
              <p className="text-sm text-green-700">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Your budget allocation closely matches industry standards, which typically indicates a well-balanced wedding budget.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}