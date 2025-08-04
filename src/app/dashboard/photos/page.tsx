import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PhotosPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Photo Gallery</h1>
          <p className="text-gray-600 mt-2">Organize your wedding photos and memories</p>
        </div>
        <Button>Upload Photos</Button>
      </div>

      {/* Album Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Photos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Albums</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Storage Used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 GB</div>
            <p className="text-xs text-muted-foreground">of 10 GB</p>
          </CardContent>
        </Card>
      </div>

      {/* Photo Albums */}
      <Card>
        <CardHeader>
          <CardTitle>Photo Albums</CardTitle>
          <CardDescription>Organize your photos by categories and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Engagement Photos */}
            <div className="group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <span className="text-4xl">💕</span>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <Button variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    View Album
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold">Engagement Photos</h3>
              <p className="text-sm text-muted-foreground">32 photos</p>
            </div>

            {/* Venue Visits */}
            <div className="group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <span className="text-4xl">🏛️</span>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <Button variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    View Album
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold">Venue Visits</h3>
              <p className="text-sm text-muted-foreground">45 photos</p>
            </div>

            {/* Dress Shopping */}
            <div className="group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <span className="text-4xl">👗</span>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <Button variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    View Album
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold">Dress Shopping</h3>
              <p className="text-sm text-muted-foreground">28 photos</p>
            </div>

            {/* Cake Tasting */}
            <div className="group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <span className="text-4xl">🎂</span>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <Button variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    View Album
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold">Cake Tasting</h3>
              <p className="text-sm text-muted-foreground">19 photos</p>
            </div>

            {/* Flowers & Decor */}
            <div className="group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <span className="text-4xl">🌸</span>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <Button variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    View Album
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold">Flowers & Decor</h3>
              <p className="text-sm text-muted-foreground">56 photos</p>
            </div>

            {/* Inspiration */}
            <div className="group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <span className="text-4xl">✨</span>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <Button variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    View Album
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold">Inspiration</h3>
              <p className="text-sm text-muted-foreground">67 photos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Added</CardTitle>
          <CardDescription>Your latest wedding planning photos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <span className="text-2xl opacity-50">📷</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}