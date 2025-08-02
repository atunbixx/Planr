import React, { useState, useEffect } from 'react';
import { 
  Home, Users, CheckSquare, Building, BarChart3, DollarSign, 
  Calendar, Settings, LogOut, Bell, Menu, X, ChevronLeft, 
  ChevronRight, ArrowRight
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
  const [currentTagline, setCurrentTagline] = useState(0);
  
  const taglines = [
    {
      headline: "Modern couples\ndeserve modern\ntools",
      subtext: "Sophisticated tools for the discerning couple. Plan your wedding with the elegance it deserves."
    },
    {
      headline: "Where elegance\nmeets\nefficiency",
      subtext: "A sophisticated planning tool that understands the nuances of luxury weddings."
    },
    {
      headline: "Your vision\ndeserves\nperfection",
      subtext: "Curated tools and intelligent workflows for couples who accept nothing less than extraordinary."
    },
    {
      headline: "Planning made\nbeautiful &\nsimple",
      subtext: "Experience the future of wedding planning with our refined platform."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center bg-black text-white">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Wedding Studio</h1>
          <div className="h-0.5 w-8 bg-pink-500 ml-2"></div>
        </div>
        <div className="flex gap-4">
          <button onClick={onSignIn} className="px-6 py-2 text-sm font-medium text-white hover:text-pink-500 transition">
            SIGN IN
          </button>
          <button className="px-6 py-2 bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 transition">
            START PLANNING
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <p className="text-pink-500 text-xs tracking-widest mb-4">
          THE NEW STANDARD IN WEDDING PLANNING
        </p>
        <h2 className="text-6xl font-bold mb-6 leading-tight whitespace-pre-line">
          {taglines[currentTagline].headline}
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          {taglines[currentTagline].subtext}
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

          <div className="grid grid-cols-2 gap-8">
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
      <section className="px-8 py-20 bg-black text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Begin?</h2>
          <p className="text-gray-300 mb-8">
            Join thousands of couples who've discovered a better way to plan their perfect day
          </p>
          <button className="px-8 py-4 bg-pink-500 text-white hover:bg-pink-600 transition flex items-center gap-2 mx-auto">
            START YOUR FREE TRIAL <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 bg-black text-white">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <p className="text-sm text-gray-400">© 2024 Wedding Studio. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-400 hover:text-pink-500 transition">Privacy</a>
            <a href="#" className="text-sm text-gray-400 hover:text-pink-500 transition">Terms</a>
            <a href="#" className="text-sm text-gray-400 hover:text-pink-500 transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, stat }: {
  icon: React.ReactElement;
  title: string;
  description: string;
  stat: string;
}) {
  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 hover:border-black transition-all">
      <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center mb-4">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <p className="text-xs text-black font-medium tracking-wider">{stat}</p>
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
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=1600&fit=crop",
      text: "Plan your wedding like a pro",
      subtext: "For the discerning bride"
    },
    {
      image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&h=1600&fit=crop",
      text: "Every detail matters",
      subtext: "Curated with precision and elegance"
    },
    {
      image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&h=1600&fit=crop",
      text: "Your perfect day awaits",
      subtext: "Start planning with confidence"
    },
    {
      image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&h=1600&fit=crop",
      text: "Luxury meets simplicity",
      subtext: "Where sophistication begins"
    },
    {
      image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&h=1600&fit=crop",
      text: "Design your dream",
      subtext: "With tools that understand elegance"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Carousel */}
      <div className="w-2/5 bg-black text-white relative overflow-hidden">
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
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
            </div>
          ))}
        </div>
        
        <div className="relative z-10 p-12 h-full flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Wedding Studio</h1>
            <div className="h-0.5 w-12 bg-white mb-8"></div>
          </div>
          
          <div className="mb-20">
            <h2 className="text-4xl font-bold mb-4">{slides[currentSlide].text}</h2>
            <p className="text-xl text-gray-300">{slides[currentSlide].subtext}</p>
          </div>
          
          <div>
            <div className="flex gap-2 mb-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1 w-8 transition-all ${
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
      <div className="w-3/5 bg-white flex items-center justify-center">
        <div className="w-full max-w-md px-12">
          <h2 className="text-4xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-12">Sign in to continue planning your perfect day</p>
          
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
function Dashboard({ clientNames, onLogout }: {
  clientNames: { client1: string; client2: string };
  onLogout: () => void;
}) {
  const [activeNav, setActiveNav] = useState('dashboard');
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-black text-white">
        <div className="p-6">
          <h1 className="text-xl font-bold mb-8">Wedding Studio</h1>
          <p className="text-xs text-gray-400 mb-1">CURRENT PROJECT</p>
          <p className="font-medium mb-8">{clientNames.client1} & {clientNames.client2}</p>
          
          <nav>
            <NavItem icon={<Home />} label="DASHBOARD" active={activeNav === 'dashboard'} onClick={() => setActiveNav('dashboard')} />
            <NavItem icon={<Users />} label="GUESTS" active={activeNav === 'guests'} onClick={() => setActiveNav('guests')} />
            <NavItem icon={<CheckSquare />} label="TASKS" active={activeNav === 'tasks'} onClick={() => setActiveNav('tasks')} />
            <NavItem icon={<Building />} label="VENDORS" active={activeNav === 'vendors'} onClick={() => setActiveNav('vendors')} />
            <NavItem icon={<BarChart3 />} label="ANALYTICS" active={activeNav === 'analytics'} onClick={() => setActiveNav('analytics')} />
            <NavItem icon={<DollarSign />} label="BUDGET" active={activeNav === 'budget'} onClick={() => setActiveNav('budget')} />
            <NavItem icon={<Calendar />} label="TIMELINE" active={activeNav === 'timeline'} onClick={() => setActiveNav('timeline')} />
          </nav>
        </div>
        
        <div className="mt-auto p-6">
          <NavItem icon={<Settings />} label="SETTINGS" />
          <NavItem icon={<LogOut />} label="SIGN OUT" onClick={onLogout} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">DASHBOARD</p>
            <h2 className="text-xl font-bold">Planning Overview</h2>
          </div>
          <div className="flex items-center gap-6">
            <Bell size={20} className="text-gray-600" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                {clientNames.client1[0]}
              </div>
              <div>
                <p className="text-sm font-medium">hello</p>
                <p className="text-xs text-gray-500">PROJECT MANAGER</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          <div className="flex-1 p-8">
            {/* Welcome Section */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-4">
                Welcome Back,<br />{clientNames.client1}
              </h1>
              <p className="text-gray-600 max-w-2xl">
                Your wedding planning journey continues. Every detail matters, every moment counts
                toward your perfect day.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Quick Actions</h2>
              <p className="text-gray-600 mb-8">Essential tools for your wedding planning workflow</p>
              
              <div className="grid grid-cols-2 gap-6">
                <ActionCard
                  icon={<Users />}
                  title="Guest Management"
                  description="Manage invitations, RSVPs, and seating arrangements"
                />
                <ActionCard
                  icon={<CheckSquare />}
                  title="Task Planning"
                  description="Track progress and manage wedding planning tasks"
                />
                <ActionCard
                  icon={<Building />}
                  title="Vendor Directory"
                  description="Find, contact, and manage wedding vendors"
                />
                <ActionCard
                  icon={<DollarSign />}
                  title="Budget Tracking"
                  description="Monitor expenses and manage wedding budget"
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Activity */}
          <div className="w-80 bg-white border-l p-6">
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
              
              <button className="text-sm text-blue-600 mt-6">
                VIEW ALL ACTIVITY (3)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ icon, label, active = false, onClick }: {
  icon: React.ReactElement;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
        active ? 'bg-white text-black' : 'hover:bg-gray-900'
      }`}
    >
      {React.cloneElement(icon, { size: 20 })}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// Action Card Component
function ActionCard({ icon, title, description }: {
  icon: React.ReactElement;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition cursor-pointer">
      <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center mb-4">
        {React.cloneElement(icon, { size: 24 })}
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
  time: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{text}</p>
        {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
      </div>
      {time && <span className="text-xs text-gray-500">{time}</span>}
    </div>
  );
}