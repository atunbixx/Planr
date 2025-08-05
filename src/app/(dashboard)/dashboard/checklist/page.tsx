import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ChecklistPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wedding Checklist</h1>
          <p className="text-gray-600 mt-2">Stay organized with your wedding planning tasks</p>
        </div>
        <Button>Add Task</Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
          <CardDescription>Your overall wedding planning progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">24 of 45 tasks completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '53%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Sections */}
      <div className="space-y-6">
        {/* 12+ Months Before */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              12+ Months Before Wedding
            </CardTitle>
            <CardDescription>Early planning essentials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <input type="checkbox" checked readOnly className="h-4 w-4 text-green-600" />
                <span className="flex-1 line-through text-green-700">Set wedding date</span>
                <span className="text-xs text-green-600">Completed</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <input type="checkbox" checked readOnly className="h-4 w-4 text-green-600" />
                <span className="flex-1 line-through text-green-700">Determine budget</span>
                <span className="text-xs text-green-600">Completed</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <input type="checkbox" checked readOnly className="h-4 w-4 text-green-600" />
                <span className="flex-1 line-through text-green-700">Book venue</span>
                <span className="text-xs text-green-600">Completed</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Create guest list draft</span>
                <span className="text-xs text-muted-foreground">In Progress</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6-12 Months Before */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
              6-12 Months Before Wedding
            </CardTitle>
            <CardDescription>Major vendors and arrangements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Book photographer</span>
                <span className="text-xs text-blue-600">In Discussion</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Book caterer</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Choose wedding dress</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Book music/DJ</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3-6 Months Before */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
              3-6 Months Before Wedding
            </CardTitle>
            <CardDescription>Detailed planning and preparations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Send save-the-dates</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Order invitations</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Plan menu with caterer</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Book florist</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1-3 Months Before */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
              1-3 Months Before Wedding
            </CardTitle>
            <CardDescription>Final preparations and confirmations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Send wedding invitations</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Final dress fitting</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Order wedding cake</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="flex-1">Confirm all vendors</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}