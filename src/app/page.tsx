'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Calendar, DollarSign, Users, CheckSquare, ArrowRight, Star, Award, ChevronDown
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { designSystem } from '@/styles/design-system';

// Main App Component
export default function WeddingStudioApp() {
  return <LandingPage />;
}

// Landing Page Component - New York Magazine Editorial Style
function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const carouselImages = [
    {
      src: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      alt: "Beautiful wedding ceremony",
      caption: "Timeless Elegance",
      credit: "Photography by Studio Collective"
    },
    {
      src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2487&q=80",
      alt: "Elegant wedding reception",
      caption: "Modern Romance",
      credit: "Featured in Vogue Weddings"
    },
    {
      src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2487&q=80",
      alt: "Wedding bouquet and rings",
      caption: "Perfect Details",
      credit: "Editorial by NY Weddings"
    },
    {
      src: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2487&q=80",
      alt: "Wedding cake and celebration",
      caption: "Celebration",
      credit: "Martha Stewart Weddings"
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: designSystem.typography.fontFamily.sans }}>
      {/* Editorial Header - New York Magazine Style */}
      <header className="border-b-2 border-black bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          {/* Top Editorial Bar */}
          <div className="flex justify-between items-center py-2 px-6 text-xs uppercase tracking-wider border-b" style={{ borderColor: designSystem.colors.gray[200] }}>
            <div className="flex items-center space-x-4" style={{ color: designSystem.colors.gray[600] }}>
              <span>New York, NY</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center space-x-4" style={{ color: designSystem.colors.gray[600] }}>
              <span className="hover:text-black transition-colors cursor-pointer">Subscribe</span>
              <span>•</span>
              <span className="hover:text-black transition-colors cursor-pointer">Newsletter</span>
            </div>
          </div>
          
          {/* Main Editorial Header */}
          <div className="flex justify-between items-center py-6 px-6">
            <div className="flex items-center">
              <h1 
                className="text-4xl font-bold tracking-tight"
                style={{ 
                  fontFamily: designSystem.typography.fontFamily.serif,
                  color: designSystem.colors.ink
                }}
              >
                WEDDING
              </h1>
              <div className="ml-3 flex flex-col">
                <div 
                  className="text-sm font-medium tracking-wider"
                  style={{ color: designSystem.colors.gray[700] }}
                >
                  STUDIO
                </div>
                <div 
                  className="h-0.5 w-12 bg-gradient-to-r from-red-500 to-pink-500"
                  style={{ backgroundColor: designSystem.colors.accent }}
                ></div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wider">
              <a href="#features" className="hover:text-red-600 transition-colors" style={{ color: designSystem.colors.gray[700] }}>PLANNING</a>
              <a href="#inspiration" className="hover:text-red-600 transition-colors" style={{ color: designSystem.colors.gray[700] }}>INSPIRATION</a>
              <a href="#reviews" className="hover:text-red-600 transition-colors" style={{ color: designSystem.colors.gray[700] }}>REVIEWS</a>
              <a href="#features" className="hover:text-red-600 transition-colors" style={{ color: designSystem.colors.gray[700] }}>FEATURES</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/sign-in"
                className="text-sm font-medium tracking-wider hover:text-red-600 transition-colors"
                style={{ color: designSystem.colors.gray[700] }}
              >
                SIGN IN
              </Link>
              <Link 
                href="/sign-up" 
                className="px-6 py-2 text-sm font-medium tracking-wider hover:bg-gray-900 transition-colors"
                style={{ 
                  backgroundColor: designSystem.colors.ink,
                  color: designSystem.colors.paper
                }}
              >
                START PLANNING
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Editorial Layout */}
      <section className="relative bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Left Content - Editorial Typography */}
            <div className="lg:col-span-7 space-y-10">
              {/* Editorial Tag */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-0.5" style={{ backgroundColor: designSystem.colors.accent }}></div>
                <span 
                  className="text-xs font-medium tracking-widest uppercase"
                  style={{ color: designSystem.colors.accent }}
                >
                  Wedding Planning Redefined
                </span>
              </div>
              
              {/* Editorial Headline */}
              <div className="space-y-6">
                <h1 
                  className="text-8xl lg:text-9xl font-light leading-none tracking-tight"
                  style={{ 
                    fontFamily: designSystem.typography.fontFamily.serif,
                    color: designSystem.colors.ink
                  }}
                >
                  Modern
                </h1>
                <h2 
                  className="text-7xl lg:text-8xl font-light italic leading-none tracking-tight ml-12"
                  style={{ 
                    fontFamily: designSystem.typography.fontFamily.serif,
                    color: designSystem.colors.gray[600]
                  }}
                >
                  Couples
                </h2>
                <h3 
                  className="text-6xl lg:text-7xl font-medium leading-none tracking-tight ml-20"
                  style={{ 
                    fontFamily: designSystem.typography.fontFamily.serif,
                    color: designSystem.colors.ink
                  }}
                >
                  Deserve Modern
                </h3>
                <h4 
                  className="text-7xl lg:text-8xl font-bold leading-none tracking-tight ml-6"
                  style={{ 
                    fontFamily: designSystem.typography.fontFamily.serif,
                    color: designSystem.colors.accent
                  }}
                >
                  Tools
                </h4>
              </div>
              
              {/* Editorial Subheadline */}
              <div className="max-w-2xl space-y-4">
                <blockquote 
                  className="text-2xl font-light leading-relaxed italic"
                  style={{ 
                    fontFamily: designSystem.typography.fontFamily.serif,
                    color: designSystem.colors.gray[700]
                  }}
                >
                  "A sophisticated planning platform that understands the nuances of luxury weddings. 
                  Where technology meets timeless elegance."
                </blockquote>
                <div className="flex items-center space-x-3 pt-2">
                  <div className="w-16 h-0.5" style={{ backgroundColor: designSystem.colors.gray[400] }}></div>
                  <span 
                    className="text-sm font-medium tracking-wider uppercase"
                    style={{ color: designSystem.colors.gray[600] }}
                  >
                    Featured Story
                  </span>
                </div>
              </div>
              
              {/* Editorial CTA */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Link 
                  href="/sign-up" 
                  className="group inline-flex items-center justify-center px-8 py-4 text-sm font-medium tracking-wider transition-all duration-300"
                  style={{ 
                    backgroundColor: designSystem.colors.ink,
                    color: designSystem.colors.paper
                  }}
                >
                  BEGIN YOUR JOURNEY
                  <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button 
                  className="px-8 py-4 text-sm font-medium tracking-wider border-2 transition-all duration-300 hover:bg-black hover:text-white"
                  style={{ 
                    borderColor: designSystem.colors.ink,
                    color: designSystem.colors.ink
                  }}
                >
                  EXPLORE FEATURES
                </button>
              </div>

              {/* Editorial Stats */}
              <div className="grid grid-cols-3 gap-8 pt-16 border-t" style={{ borderColor: designSystem.colors.gray[200] }}>
                <div className="text-center">
                  <div 
                    className="text-5xl font-bold mb-2"
                    style={{ 
                      fontFamily: designSystem.typography.fontFamily.serif,
                      color: designSystem.colors.ink
                    }}
                  >
                    10K+
                  </div>
                  <div 
                    className="text-xs font-medium tracking-wider uppercase"
                    style={{ color: designSystem.colors.gray[600] }}
                  >
                    Weddings Curated
                  </div>
                </div>
                <div className="text-center border-l border-r" style={{ borderColor: designSystem.colors.gray[200] }}>
                  <div 
                    className="text-5xl font-bold mb-2"
                    style={{ 
                      fontFamily: designSystem.typography.fontFamily.serif,
                      color: designSystem.colors.ink
                    }}
                  >
                    98%
                  </div>
                  <div 
                    className="text-xs font-medium tracking-wider uppercase"
                    style={{ color: designSystem.colors.gray[600] }}
                  >
                    Satisfaction Rate
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-5xl font-bold mb-2"
                    style={{ 
                      fontFamily: designSystem.typography.fontFamily.serif,
                      color: designSystem.colors.ink
                    }}
                  >
                    $2M+
                  </div>
                  <div 
                    className="text-xs font-medium tracking-wider uppercase"
                    style={{ color: designSystem.colors.gray[600] }}
                  >
                    Budget Managed
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Editorial Photography Carousel */}
            <div className="lg:col-span-5">
              <div className="relative">
                {/* Main Editorial Image Carousel */}
                <div className="relative h-[700px] w-full overflow-hidden shadow-2xl bg-black rounded-lg">
                  {carouselImages.map((image, index) => (
                    <div 
                      key={index}
                      className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                      }`}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                        priority={index === 0}
                        className="filter saturate-110 contrast-105"
                      />
                      {/* Editorial Caption Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                        <div className="text-white">
                          <div 
                            className="text-2xl font-bold mb-2"
                            style={{ fontFamily: designSystem.typography.fontFamily.serif }}
                          >
                            {image.caption}
                          </div>
                          <div className="text-sm tracking-wider opacity-90">
                            {image.credit}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Carousel Navigation Arrows */}
                  <button
                    onClick={() => goToSlide(currentSlide === 0 ? carouselImages.length - 1 : currentSlide - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-300"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => goToSlide(currentSlide === carouselImages.length - 1 ? 0 : currentSlide + 1)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-300"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                {/* Editorial Navigation Dots */}
                <div className="flex justify-center mt-8 space-x-2">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        index === currentSlide ? 'w-16 bg-black' : 'w-2 bg-gray-300 hover:bg-gray-500'
                      }`}
                      onClick={() => goToSlide(index)}
                    />
                  ))}
                </div>
                
                {/* Editorial Photo Credit */}
                <div className="mt-6 text-center">
                  <p 
                    className="text-sm italic"
                    style={{ 
                      fontFamily: designSystem.typography.fontFamily.serif,
                      color: designSystem.colors.gray[600]
                    }}
                  >
                    Photography courtesy of Wedding Studio Editorial Team
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Magazine Layout */}
      <section className="py-24" style={{ backgroundColor: designSystem.colors.gray[50] }}>
        <div className="max-w-7xl mx-auto px-6">
          {/* Editorial Section Header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-0.5" style={{ backgroundColor: designSystem.colors.accent }}></div>
              <span 
                className="text-xs font-medium tracking-widest uppercase"
                style={{ color: designSystem.colors.accent }}
              >
                Essential Planning Tools
              </span>
              <div className="w-12 h-0.5" style={{ backgroundColor: designSystem.colors.accent }}></div>
            </div>
            <h2 
              className="text-6xl font-light mb-8"
              style={{ 
                fontFamily: designSystem.typography.fontFamily.serif,
                color: designSystem.colors.ink
              }}
            >
              Everything You Need,
              <br />
              <span className="italic font-medium">Nothing You Don't</span>
            </h2>
            <p 
              className="text-xl font-light max-w-3xl mx-auto leading-relaxed"
              style={{ color: designSystem.colors.gray[700] }}
            >
              Curated features designed for the discerning couple who values both sophistication 
              and simplicity in their wedding planning journey.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={DollarSign}
              title="Budget Intelligence"
              description="Advanced analytics and real-time tracking ensure every dollar is purposefully allocated with sophisticated reporting and insights."
              stat="Average 23% Savings"
              accent="rose"
            />
            <FeatureCard
              icon={Users}
              title="Guest Curation"
              description="Elegant RSVP management, dietary preferences, and seating arrangements crafted with editorial precision and attention to detail."
              stat="Up to 500 Guests"
              accent="purple"
            />
            <FeatureCard
              icon={CheckSquare}
              title="Task Orchestration"
              description="Intelligent task prioritization keeps your planning on schedule with stress-free, systematic workflows and automated reminders."
              stat="200+ Templates"
              accent="blue"
            />
            <FeatureCard
              icon={Calendar}
              title="Timeline Design"
              description="Craft the perfect wedding day schedule with minute-by-minute precision, unlimited revisions, and seamless coordination."
              stat="Unlimited Revisions"
              accent="green"
            />
          </div>
        </div>
      </section>

      {/* Editorial Testimonial - BLACK SECTION */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="mb-10">
            <Star className="w-10 h-10 mx-auto mb-6 text-red-500" />
          </div>
          <blockquote 
            className="text-4xl lg:text-5xl font-light leading-relaxed italic mb-10 text-white"
            style={{ fontFamily: designSystem.typography.fontFamily.serif }}
          >
            "The most sophisticated wedding planning platform we've encountered. A masterclass in both 
            design and functionality that sets a new standard for the industry."
          </blockquote>
          <div className="flex items-center justify-center space-x-6">
            <div className="w-20 h-0.5 bg-red-500"></div>
            <cite className="text-sm font-medium tracking-widest uppercase not-italic text-red-400">
              Modern Wedding Magazine
            </cite>
            <div className="w-20 h-0.5 bg-red-500"></div>
          </div>
        </div>
      </section>

      {/* CTA Section - Editorial Style */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <Award className="w-16 h-16 mx-auto mb-10" style={{ color: designSystem.colors.accent }} />
          <h3 
            className="text-6xl font-light mb-8"
            style={{ 
              fontFamily: designSystem.typography.fontFamily.serif,
              color: designSystem.colors.ink
            }}
          >
            Ready to Begin Your
            <br />
            <span className="italic font-medium" style={{ color: designSystem.colors.accent }}>Perfect Day?</span>
          </h3>
          <p 
            className="text-xl font-light mb-12 leading-relaxed max-w-3xl mx-auto"
            style={{ color: designSystem.colors.gray[700] }}
          >
            Join thousands of couples who've discovered a more elegant approach to wedding planning. 
            Experience the difference that thoughtful design and intelligent features make.
          </p>
          <Link 
            href="/sign-up"
            className="inline-flex items-center px-12 py-5 text-sm font-medium tracking-widest uppercase transition-all duration-300 group hover:shadow-lg"
            style={{ 
              backgroundColor: designSystem.colors.ink,
              color: designSystem.colors.paper
            }}
          >
            Start Your Free Trial
            <ArrowRight size={18} className="ml-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer style={{ backgroundColor: designSystem.colors.ink, color: designSystem.colors.paper }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h4 
                className="text-2xl font-bold mb-6"
                style={{ fontFamily: designSystem.typography.fontFamily.serif }}
              >
                WEDDING STUDIO
              </h4>
              <p 
                className="text-sm leading-relaxed"
                style={{ color: designSystem.colors.gray[400] }}
              >
                The premier wedding planning platform for modern couples who demand excellence, 
                sophistication, and timeless elegance.
              </p>
            </div>
            <div>
              <h5 
                className="text-sm font-medium tracking-wider mb-6 uppercase"
                style={{ color: designSystem.colors.accent }}
              >
                Features
              </h5>
              <ul className="space-y-3 text-sm" style={{ color: designSystem.colors.gray[400] }}>
                <li><a href="#" className="hover:text-white transition-colors">Budget Planning</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guest Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vendor Directory</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Timeline Design</a></li>
              </ul>
            </div>
            <div>
              <h5 
                className="text-sm font-medium tracking-wider mb-6 uppercase"
                style={{ color: designSystem.colors.accent }}
              >
                Company
              </h5>
              <ul className="space-y-3 text-sm" style={{ color: designSystem.colors.gray[400] }}>
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press & Media</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 
                className="text-sm font-medium tracking-wider mb-6 uppercase"
                style={{ color: designSystem.colors.accent }}
              >
                Support
              </h5>
              <ul className="space-y-3 text-sm" style={{ color: designSystem.colors.gray[400] }}>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div 
            className="border-t pt-8 flex flex-col md:flex-row justify-between items-center"
            style={{ borderColor: designSystem.colors.gray[800] }}
          >
            <p className="text-sm" style={{ color: designSystem.colors.gray[400] }}>
              © 2024 Wedding Studio. All rights reserved. Designed in New York.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span 
                className="text-xs tracking-wider uppercase"
                style={{ color: designSystem.colors.gray[500] }}
              >
                Follow Us
              </span>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-red-400 transition-colors" style={{ color: designSystem.colors.gray[400] }}>Instagram</a>
                <a href="#" className="hover:text-red-400 transition-colors" style={{ color: designSystem.colors.gray[400] }}>Pinterest</a>
                <a href="#" className="hover:text-red-400 transition-colors" style={{ color: designSystem.colors.gray[400] }}>Facebook</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Enhanced Feature Card - Editorial Style
function FeatureCard({ icon, title, description, stat, accent }: {
  icon: LucideIcon;
  title: string;
  description: string;
  stat: string;
  accent: 'rose' | 'purple' | 'blue' | 'green';
}) {
  const Icon = icon;
  
  const accentColors = {
    rose: 'from-rose-500 to-pink-500',
    purple: 'from-purple-500 to-indigo-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500'
  };
  
  return (
    <div 
      className="group bg-white p-10 shadow-sm hover:shadow-xl transition-all duration-500 border-l-4 border-transparent hover:border-red-500"
      style={{ backgroundColor: designSystem.colors.paper }}
    >
      <div className={`w-20 h-20 bg-gradient-to-br ${accentColors[accent]} text-white rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={32} />
      </div>
      <h3 
        className="text-2xl font-medium mb-6 group-hover:text-red-600 transition-colors"
        style={{ 
          fontFamily: designSystem.typography.fontFamily.serif,
          color: designSystem.colors.ink
        }}
      >
        {title}
      </h3>
      <p 
        className="font-light leading-relaxed mb-8"
        style={{ color: designSystem.colors.gray[700] }}
      >
        {description}
      </p>
      <div className="pt-6 border-t" style={{ borderColor: designSystem.colors.gray[200] }}>
        <span 
          className="text-xs font-medium tracking-wider uppercase"
          style={{ color: designSystem.colors.gray[600] }}
        >
          {stat}
        </span>
      </div>
    </div>
  );
}