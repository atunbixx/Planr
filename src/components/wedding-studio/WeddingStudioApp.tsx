import React, { useState, useEffect } from 'react';
import { 
  Home, Users, CheckSquare, Building, BarChart3, DollarSign, 
  Calendar, Settings, LogOut, Bell, ArrowRight 
} from 'lucide-react';

// Main App Component
export default function WeddingStudioApp() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clientNames, setClientNames] = useState({ client1: 'Precious', client2: 'Femi' });

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('landing');
  };

  if (currentPage === 'landing') {
    return <LandingPage onSignIn={() => setCurrentPage('login')} />;
  }

  if (currentPage === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentPage === 'dashboard' && isLoggedIn) {
    return <Dashboard clientNames={clientNames} onLogout={handleLogout} />;
  }

  return <LandingPage onSignIn={() => setCurrentPage('login')} />;
}

// Landing Page Component
function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Wedding Studio</h1>
          <div className="h-0.5 w-8 bg-pink-500 ml-2"></div>
        </div>
        <div className="flex gap-4">
          <button onClick={onSignIn} className="px-6 py-2 text-sm font-medium">
            SIGN IN
          </button>
          <button className="px-6 py-2 bg-black text-white text-sm font-medium">
            START PLANNING
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <p className="text-pink-500 text-xs tracking-widest mb-4">
          THE NEW STANDARD IN WEDDING PLANNING
        </p>
        <h2 className="text-6xl font-bold mb-6 leading-tight">
          Modern couples<br />deserve modern<br />tools
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Sophisticated tools for the discerning couple. Plan your wedding with the elegance it deserves.
        </p>
        <div className="flex gap-4">
          <button className="px-8 py-3 bg-black text-white flex items-center gap-2">
            Begin Your Journey <ArrowRight size={16} />
          </button>
          <button className="px-8 py-3 border border-gray-300">
            Explore Features
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-16 mt-20">
          <div>
            <h3 className="text-3xl font-bold">10K+</h3>
            <p className="text-xs text-gray-500 tracking-wider">WEDDINGS PLANNED</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold">98%</h3>
            <p className="text-xs text-gray-500 tracking-wider">SATISFACTION RATE</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold">$2M+</h3>
            <p className="text-xs text-gray-500 tracking-wider">BUDGET MANAGED</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <p className="text-pink-500 text-xs tracking-widest mb-4 text-center">
            COMPREHENSIVE PLANNING TOOLS
          </p>
          <h2 className="text-4xl font-bold text-center mb-4">
            Everything You Need, Nothing You Don't
          </h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Curated features designed for the modern couple who values both sophistication and simplicity
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              icon={<DollarSign />}
              title="Budget Intelligence"
              description="Advanced analytics and real-time tracking ensure every dollar is purposefully allocated"
              stat="AVERAGE SAVINGS: 23%"
            />
            <FeatureCard
              icon={<Users />}
              title="Guest Management"
              description="Elegant RSVP tracking, dietary preferences, and seating arrangements in one place"
              stat="UP TO 500 GUESTS"
            />
            <FeatureCard
              icon={<CheckSquare />}
              title="Task Orchestration"
              description="Intelligent task prioritization keeps your planning on schedule and stress-free"
              stat="200+ TASK TEMPLATES"
            />
            <FeatureCard
              icon={<Calendar />}
              title="Timeline Design"
              description="Craft the perfect wedding day schedule with minute-by-minute precision"
              stat="UNLIMITED REVISIONS"
            />
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl italic mb-8">
            "The most sophisticated wedding planning platform we've encountered. 
            A masterclass in both design and functionality."
          </p>
          <p className="text-sm text-gray-500">— MODERN WEDDING MAGAZINE</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 py-20 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Begin?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of couples who've discovered a better way to plan their perfect day
          </p>
          <button className="px-8 py-4 bg-pink-500 text-white flex items-center gap-2 mx-auto">
            START YOUR FREE TRIAL <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 md:mb-0">© 2024 Wedding Studio. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Terms</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Login Page Component
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('hello@atunbi.net');
  const [password, setPassword] = useState('');

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      text: "Plan your wedding like a pro",
      subtext: "For the discerning bride"
    },
    {
      image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2487&q=80",
      text: "Every detail matters",
      subtext: "Curated with precision and elegance"
    },
    {
      image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2487&q=80",
      text: "Your perfect day awaits",
      subtext: "Start planning with confidence"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Carousel */}
      <div className="w-full md:w-2/5 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.text}
                className="w-full h-full object-cover opacity-40"
              />
            </div>
          ))}
        </div>
        
        <div className="relative z-10 p-6 md:p-12 h-full flex flex-col justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Wedding Studio</h1>
            <div className="h-0.5 w-8 bg-white mb-8"></div>
          </div>
          
          <div className="mb-8 md:mb-20">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">{slides[currentSlide].text}</h2>
            <p className="text-lg text-gray-300">{slides[currentSlide].subtext}</p>
          </div>
          
          <div>
            <div className="flex gap-2 mb-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1 w-6 transition-all ${
                    index === currentSlide ? 'bg-white' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs tracking-wider text-gray-400">
              TRUSTED BY COUPLES WORLDWIDE
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full md:w-3/5 bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-8 md:mb-12">Sign in to continue planning your perfect day</p>
          
          <div>
            <div className="mb-6">
              <label className="text-xs tracking-wider text-gray-700 block mb-2">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
                required
              />
            </div>
            
            <div className="mb-8">
              <label className="text-xs tracking-wider text-gray-700 block mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
                required
              />
            </div>
            
            <button
              onClick={onLogin}
              className="w-full py-4 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition"
            >
              SIGN IN
            </button>
          </div>
          
          <p className="text-center mt-8 text-sm text-gray-600">
            New to our platform? <a href="#" className="text-black font-medium">Create Account</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ clientNames, onLogout }: { clientNames: { client1: string, client2: string }, onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState('dashboard');
  
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-black text-white flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold mb-8">Wedding Studio</h1>
          <p className="text-xs text-gray-400 mb-1">CURRENT PROJECT</p>
          <p className="font-medium mb-8">{clientNames.client1} & {clientNames.client2}</p>
          
          <nav className="space-y-2">
            <NavItem 
              icon={<Home size={18} />} 
              label="DASHBOARD" 
              active={activeNav === 'dashboard'} 
              onClick={() => setActiveNav('dashboard')} 
            />
            <NavItem 
              icon={<Users size={18} />} 
              label="GUESTS" 
              active={activeNav === 'guests'} 
              onClick={() => setActiveNav('guests')} 
            />
            <NavItem 
              icon={<CheckSquare size={18} />} 
              label="TASKS" 
              active={activeNav === 'tasks'} 
              onClick={() => setActiveNav('tasks')} 
            />
            <NavItem 
              icon={<Building size={18} />} 
              label="VENDORS" 
              active={activeNav === 'vendors'} 
              onClick={() => setActiveNav('vendors')} 
            />
            <NavItem 
              icon={<BarChart3 size={18} />} 
              label="ANALYTICS" 
              active={activeNav === 'analytics'} 
              onClick={() => setActiveNav('analytics')} 
            />
            <NavItem 
              icon={<DollarSign size={18} />} 
              label="BUDGET" 
              active={activeNav === 'budget'} 
              onClick={() => setActiveNav('budget')} 
            />
            <NavItem 
              icon={<Calendar size={18} />} 
              label="TIMELINE" 
              active={activeNav === 'timeline'} 
              onClick={() => setActiveNav('timeline')} 
            />
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-gray-800">
          <NavItem 
            icon={<Settings size={18} />} 
            label="SETTINGS" 
            active={activeNav === 'settings'}
            onClick={() => setActiveNav('settings')}
          />
          <NavItem 
            icon={<LogOut size={18} />} 
            label="SIGN OUT" 
            onClick={onLogout} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-xs text-gray-500 mb-1">DASHBOARD</p>
            <h2 className="text-xl font-bold">Planning Overview</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-900">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                {clientNames.client1[0]}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">hello@atunbi.net</p>
                <p className="text-xs text-gray-500">PROJECT MANAGER</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Welcome Section */}
            <div className="mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Welcome Back,<br />{clientNames.client1}
              </h1>
              <p className="text-gray-600 max-w-2xl">
                Your wedding planning journey continues. Every detail matters, every moment counts
                toward your perfect day.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-2">Quick Actions</h2>
              <p className="text-gray-600 mb-8">Essential tools for your wedding planning workflow</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ActionCard
                  icon={<Users size={24} />}
                  title="Guest Management"
                  description="Manage invitations, RSVPs, and seating arrangements"
                />
                <ActionCard
                  icon={<CheckSquare size={24} />}
                  title="Task Planning"
                  description="Track progress and manage wedding planning tasks"
                />
                <ActionCard
                  icon={<Building size={24} />}
                  title="Vendor Directory"
                  description="Find, contact, and manage wedding vendors"
                />
                <ActionCard
                  icon={<DollarSign size={24} />}
                  title="Budget Tracking"
                  description="Monitor expenses and manage wedding budget"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Activity */}
      <div className="w-full md:w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <h3 className="text-sm text-gray-500 mb-2">PROJECT OVERVIEW</h3>
        <h2 className="text-xl font-bold mb-8">{clientNames.client1} & {clientNames.client2}</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <p className="text-sm text-gray-600 mb-6">Stay updated with your wedding planning progress</p>
          
          <div className="space-y-4">
            <ActivityItem
              icon="🔄"
              text="Live Activity Feed"
              subtext="Real-time updates from your wedding planning"
              time=""
            />
            <ActivityItem
              icon="📧"
              text='hello@atunbi.net created task "djfg"'
              time="10h ago"
            />
            <ActivityItem
              icon="📧"
              text='Precious created task "sfsfdsf fsfds"'
              time="1d ago"
            />
            <ActivityItem
              icon="💰"
              text='hello added expense "fsfds" for $250000'
              time="4d ago"
            />
          </div>
          
          <button className="text-sm text-blue-600 hover:text-blue-800 mt-6">
            VIEW ALL ACTIVITY (3)
          </button>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, stat }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  stat: string 
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <p className="text-xs text-pink-500 font-medium tracking-wider">{stat}</p>
    </div>
  );
}

// Navigation Item Component
function NavItem({ 
  icon, 
  label, 
  active = false, 
  onClick = () => {}
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
        active ? 'bg-white text-black' : 'text-gray-300 hover:bg-gray-900 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// Action Card Component
function ActionCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition cursor-pointer">
      <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ icon, text, subtext, time }: { 
  icon: string; 
  text: string; 
  subtext?: string; 
  time: string 
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{text}</p>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
      {time && <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>}
    </div>
  );
}
