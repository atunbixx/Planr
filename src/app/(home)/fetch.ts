export async function getOverviewData() {
  try {
    // Fetch wedding planner dashboard data
    // For demo purposes, we'll try both authenticated and fallback approaches
    let response;
    
    // First, try to get token from client-side if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        response = await fetch('http://localhost:3000/api/dashboard/overview', {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    }
    
    // If no token or server-side, make unauthenticated request (will use fallback data)
    if (!response) {
      response = await fetch('http://localhost:3000/api/dashboard/overview', {
        cache: 'no-store'
      });
    }
    
    if (!response || !response.ok) {
      throw new Error('Failed to fetch wedding data');
    }
    
    const { data } = await response.json();
    
    return {
      guests: {
        value: data.guestTotal,
        growthRate: data.guests ? 
          (data.guests.accepted / Math.max(data.guestTotal, 1)) * 100 - 65 : 0,
      },
      budget: {
        value: data.budget.remainingBudget,
        growthRate: data.budget.percentSpent > 0 ? 
          Math.max(-25, -(data.budget.percentSpent - 40)) : 5.2,
      },
      vendors: {
        value: data.vendorBookedTotal,
        growthRate: data.vendorTotal > 0 ? 
          ((data.vendorBookedTotal / data.vendorTotal) * 100) - 50 : 0,
      },
      tasks: {
        value: Object.values(data.vendorCritical || {}).filter(Boolean).length,
        growthRate: Object.values(data.vendorCritical || {}).filter(Boolean).length >= 3 ? 8.5 : -2.1,
      },
    };
  } catch (error) {
    console.error('Failed to fetch wedding data:', error);
    // Fallback to realistic wedding demo data
    return {
      guests: {
        value: 120,
        growthRate: 8.5,
      },
      budget: {
        value: 18500,
        growthRate: -12.3,
      },
      vendors: {
        value: 8,
        growthRate: 22.1,
      },
      tasks: {
        value: 6,
        growthRate: -4.2,
      },
    };
  }
}

export async function getChatsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      name: "Jacob Jones",
      profile: "/images/user/user-01.png",
      isActive: true,
      lastMessage: {
        content: "See you tomorrow at the meeting!",
        type: "text",
        timestamp: "2024-12-19T14:30:00Z",
        isRead: false,
      },
      unreadCount: 3,
    },
    {
      name: "Wilium Smith",
      profile: "/images/user/user-03.png",
      isActive: true,
      lastMessage: {
        content: "Thanks for the update",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "Johurul Haque",
      profile: "/images/user/user-04.png",
      isActive: false,
      lastMessage: {
        content: "What's up?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "M. Chowdhury",
      profile: "/images/user/user-05.png",
      isActive: false,
      lastMessage: {
        content: "Where are you now?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 2,
    },
    {
      name: "Akagami",
      profile: "/images/user/user-07.png",
      isActive: false,
      lastMessage: {
        content: "Hey, how are you?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
  ];
}