import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import NotificationSettings from '@/components/pwa/NotificationSettings'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and wedding preferences</p>
      </div>

      {/* Wedding Details */}
      <Card>
        <CardHeader>
          <CardTitle>Wedding Details</CardTitle>
          <CardDescription>Basic information about your wedding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bride-name">Bride&apos;s Name</Label>
              <Input id="bride-name" placeholder="Enter bride's name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groom-name">Groom&apos;s Name</Label>
              <Input id="groom-name" placeholder="Enter groom's name" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wedding-date">Wedding Date</Label>
              <Input id="wedding-date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-count">Expected Guest Count</Label>
              <Input id="guest-count" type="number" placeholder="Enter guest count" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" placeholder="Enter venue name and location" />
          </div>
          
          <Button>Save Wedding Details</Button>
        </CardContent>
      </Card>

      {/* Budget Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Settings</CardTitle>
          <CardDescription>Manage your wedding budget preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total-budget">Total Wedding Budget</Label>
            <Input id="total-budget" type="number" placeholder="Enter total budget" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select id="currency" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-threshold">Budget Alert Threshold</Label>
              <select id="alert-threshold" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="80">80% of budget</option>
                <option value="85">85% of budget</option>
                <option value="90">90% of budget</option>
                <option value="95">95% of budget</option>
              </select>
            </div>
          </div>
          
          <Button>Save Budget Settings</Button>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <NotificationSettings />

      {/* Email Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose how you'd like to receive email updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <input type="checkbox" id="email-notifications" className="h-4 w-4" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-task-reminders" className="text-base">Task Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded about upcoming deadlines</p>
            </div>
            <input type="checkbox" id="email-task-reminders" className="h-4 w-4" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-budget-alerts" className="text-base">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">Notifications when approaching budget limits</p>
            </div>
            <input type="checkbox" id="email-budget-alerts" className="h-4 w-4" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-vendor-updates" className="text-base">Vendor Updates</Label>
              <p className="text-sm text-muted-foreground">Updates from your wedding vendors</p>
            </div>
            <input type="checkbox" id="email-vendor-updates" className="h-4 w-4" />
          </div>
          
          <Button>Save Email Preferences</Button>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input id="display-name" placeholder="Enter your display name" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select id="timezone" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="America/New_York">Eastern Time (UTC-5)</option>
              <option value="America/Chicago">Central Time (UTC-6)</option>
              <option value="America/Denver">Mountain Time (UTC-7)</option>
              <option value="America/Los_Angeles">Pacific Time (UTC-8)</option>
              <option value="Europe/London">London (UTC+0)</option>
              <option value="Europe/Paris">Paris (UTC+1)</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select id="language" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
            </select>
          </div>
          
          <Button>Save Account Settings</Button>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>Manage your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Export Data</h3>
              <p className="text-sm text-muted-foreground">Download a copy of all your wedding planning data</p>
            </div>
            <Button variant="outline">Export</Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Delete Account</h3>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}