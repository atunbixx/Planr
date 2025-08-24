import { Suspense } from "react";

// Wedding Data Fetching Function
async function getWeddingOverviewData() {
  try {
    // Try to fetch from API first (with fallback)
    const response = await fetch('http://localhost:3000/api/dashboard/overview', {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN || 'demo-token'}`
      }
    });

    if (response.ok) {
      const { data } = await response.json();
      return {
        guests: {
          value: data.guestTotal || 120,
          growthRate: 8.5,
          label: "Guest Invitations"
        },
        budget: {
          value: data.budget?.remainingBudget || 18500,
          growthRate: -12.3,
          label: "Budget Remaining"
        },
        vendors: {
          value: data.vendorBookedTotal || 8,
          growthRate: 22.1,
          label: "Vendors Secured"
        },
        tasks: {
          value: Object.values(data.vendorCritical || {}).filter(Boolean).length || 6,
          growthRate: -4.2,
          label: "Priority Items"
        }
      };
    }
  } catch (error) {
    console.log('API not available, using demo data');
  }

  // Fallback to demo data
  return {
    guests: {
      value: 120,
      growthRate: 8.5,
      label: "Guest Invitations"
    },
    budget: {
      value: 18500,
      growthRate: -12.3,
      label: "Budget Remaining"
    },
    vendors: {
      value: 8,
      growthRate: 22.1,
      label: "Vendors Secured"
    },
    tasks: {
      value: 6,
      growthRate: -4.2,
      label: "Priority Items"
    }
  };
}

// Professional Wedding Card Component
function WeddingMetricCard({ 
  data, 
  icon 
}: { 
  data: { value: number; growthRate: number; label: string }, 
  icon: React.ReactNode 
}) {
  const isPositive = data.growthRate >= 0;
  const formatValue = (val: number) => {
    if (data.label.includes('Budget')) {
      return `$${val.toLocaleString()}`;
    }
    return val.toString();
  };

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark border border-stroke dark:border-stroke-dark">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-2 dark:bg-gray-dark">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          isPositive ? 'text-green-500' : 'text-red-500'
        }`}>
          <span>{isPositive ? '↗' : '↘'}</span>
          {Math.abs(data.growthRate)}%
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-2xl font-bold text-dark dark:text-white">
          {formatValue(data.value)}
        </h3>
        <p className="text-sm text-dark-6 mt-1">{data.label}</p>
      </div>
    </div>
  );
}

// Wedding Overview Cards Component
async function WeddingOverviewCards() {
  const data = await getWeddingOverviewData();

  const icons = {
    guests: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
    budget: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91 2.28.6 4.18 1.58 4.18 3.91 0 1.77-1.35 2.81-2.73 3.16z"/>
      </svg>
    ),
    vendors: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
        <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
      </svg>
    ),
    tasks: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-orange-500">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
    )
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <WeddingMetricCard data={data.guests} icon={icons.guests} />
      <WeddingMetricCard data={data.budget} icon={icons.budget} />
      <WeddingMetricCard data={data.vendors} icon={icons.vendors} />
      <WeddingMetricCard data={data.tasks} icon={icons.tasks} />
    </div>
  );
}

// Loading Skeleton
function WeddingCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export default function WeddingAdminDashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Wedding Planning Dashboard
        </h1>
        <p className="mt-2 text-sm text-dark-6 dark:text-dark-4">
          Professional overview of your wedding planning progress
        </p>
      </div>

      {/* Overview Cards */}
      <Suspense fallback={<WeddingCardsSkeleton />}>
        <WeddingOverviewCards />
      </Suspense>

      {/* Quick Actions Section */}
      <div className="mt-8 grid grid-cols-12 gap-4 md:mt-12 md:gap-6 2xl:mt-16 2xl:gap-8">
        <div className="col-span-12 rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card border border-stroke dark:border-stroke-dark">
          <h2 className="text-lg font-semibold text-dark dark:text-white mb-6">
            Wedding Planning Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border-2 border-dashed border-stroke dark:border-stroke-dark p-6 text-center hover:border-primary transition-colors cursor-pointer group">
              <div className="flex justify-center mb-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-dark-6 group-hover:text-primary">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-dark dark:text-white mb-2">Manage Guests</h3>
              <p className="text-sm text-dark-6">Track RSVPs, dietary requirements, and seating</p>
            </div>
            
            <div className="rounded-lg border-2 border-dashed border-stroke dark:border-stroke-dark p-6 text-center hover:border-primary transition-colors cursor-pointer group">
              <div className="flex justify-center mb-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-dark-6 group-hover:text-primary">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-dark dark:text-white mb-2">Find Vendors</h3>
              <p className="text-sm text-dark-6">Browse and book photographers, caterers, venues</p>
            </div>
            
            <div className="rounded-lg border-2 border-dashed border-stroke dark:border-stroke-dark p-6 text-center hover:border-primary transition-colors cursor-pointer group">
              <div className="flex justify-center mb-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-dark-6 group-hover:text-primary">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91 2.28.6 4.18 1.58 4.18 3.91 0 1.77-1.35 2.81-2.73 3.16z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-dark dark:text-white mb-2">Track Budget</h3>
              <p className="text-sm text-dark-6">Monitor expenses and payment schedules</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}