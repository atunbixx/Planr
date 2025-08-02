'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const slides = [
    {
      src: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=1600",
      text: "Plan your wedding like a pro",
      subtext: "For the discerning bride"
    },
    {
      src: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=1600",
      text: "Every detail matters",
      subtext: "Curated with precision and elegance"
    },
    {
      src: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=1600",
      text: "Your perfect day awaits",
      subtext: "Start planning with confidence"
    },
    {
      src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=1600",
      text: "Luxury meets simplicity",
      subtext: "Where sophistication begins"
    },
    {
      src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=1600",
      text: "Design your dream",
      subtext: "With tools that understand elegance"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLocalError(null);
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Carousel */}
      <div className="w-2/5 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={slide.src}
                alt={slide.text}
                fill
                style={{ objectFit: 'cover' }}
                priority={index === 0}
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
                  className={`h-1 w-8 transition-all ${index === currentSlide ? 'bg-white' : 'bg-gray-600'}`}
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
          
          {localError && <p className="text-red-500 mb-4">{localError}</p>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="text-xs tracking-wider text-gray-700 block mb-2">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-4 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition"
            >
              SIGN IN
            </button>
          </form>
          
          <p className="text-center mt-8 text-sm text-gray-600">
            New to our platform? <a href="#" className="text-black font-medium">Create Account</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;