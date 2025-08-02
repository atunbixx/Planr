'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'
import { BudgetTemplate, useBudget } from '@/hooks/useBudget'
import { useToast } from '@/hooks/useToast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  Users,
  Star,
  Check
} from 'lucide-react'

interface BudgetTemplatesProps {
  onTemplateSelected: () => void
}

export function BudgetTemplates({ onTemplateSelected }: BudgetTemplatesProps) {
  const { templates, initializeFromTemplate } = useBudget()
  const { addToast } = useToast()
  const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplate | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [totalBudget, setTotalBudget] = useState<string>('50000')
  const [isLoading, setIsLoading] = useState(false)

  const templateIcons = {
    'Intimate Wedding': Users,
    'Classic Wedding': Star,
    'Luxury Wedding': TrendingUp,
    'Grand Wedding': Sparkles
  } as const

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !totalBudget) return

    setIsLoading(true)
    try {
      const budget = parseFloat(totalBudget)
      if (isNaN(budget) || budget <= 0) {
        throw new Error('Please enter a valid budget amount')
      }

      await initializeFromTemplate(selectedTemplate.id, budget)
      
      addToast({
        title: 'Budget initialized',
        description: `Your budget has been set up using the ${selectedTemplate.name} template`,
        type: 'success'
      })

      setIsOpen(false)
      onTemplateSelected()
    } catch (error) {
      console.error('Error applying template:', error)
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to apply template',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const Icon = templateIcons[template.name as keyof typeof templateIcons] || Star
          
          return (
            <Card 
              key={template.id} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                selectedTemplate?.id === template.id && "ring-2 ring-accent"
              )}
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-accent" />
                  {template.name}
                </CardTitle>
                <CardDescription>{template.budget_range}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Top Categories:</p>
                  {template.categories.slice(0, 3).map((cat, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-600">{cat.name}</span>
                      <span className="font-medium">{cat.percentage}%</span>
                    </div>
                  ))}
                  {template.categories.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{template.categories.length - 3} more categories
                    </p>
                  )}
                </div>

                {selectedTemplate?.id === template.id && (
                  <div className="mt-4 flex items-center gap-2 text-accent">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              size="lg"
              disabled={!selectedTemplate}
              onClick={() => setIsOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Apply Selected Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Set Your Wedding Budget</DialogTitle>
              <DialogDescription>
                Enter your total wedding budget to apply the {selectedTemplate?.name} template
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="budget">Total Wedding Budget</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="budget"
                    type="number"
                    step="1000"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    className="pl-9"
                    placeholder="50000"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended range: {selectedTemplate?.budget_range}
                </p>
              </div>

              {selectedTemplate && totalBudget && parseFloat(totalBudget) > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Budget Breakdown Preview:</p>
                  {selectedTemplate.categories.slice(0, 4).map((cat, idx) => {
                    const amount = Math.round((cat.percentage / 100) * parseFloat(totalBudget))
                    return (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-gray-600">{cat.name}</span>
                        <span className="font-medium">${amount.toLocaleString()}</span>
                      </div>
                    )
                  })}
                  {selectedTemplate.categories.length > 4 && (
                    <p className="text-xs text-gray-500">
                      +{selectedTemplate.categories.length - 4} more categories
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApplyTemplate} 
                disabled={isLoading || !totalBudget || parseFloat(totalBudget) <= 0}
              >
                Apply Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}