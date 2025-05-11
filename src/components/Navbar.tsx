 'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { useUser, SignOutButton } from '@clerk/nextjs';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { isSignedIn } = useUser();
  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <img 
                src="/Rezia_Logo_long.png" 
                alt="Rezia" 
                className="h-10 w-auto" 
              />
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === '/' ? 'text-rezia-blue' : 'text-gray-700 hover:text-rezia-blue'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="#features"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rezia-blue"
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rezia-blue"
                >
                  How It Works
                </Link>
                <Link
                  href="#pricing"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rezia-blue"
                >
                  Pricing
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {isSignedIn ? (
                <>
                  {/* Dashboard link for signed-in users */}
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-rezia-blue"
                  >
                    Dashboard
                  </Link>
                  <SignOutButton>
                    <Button variant="outline">Sign Out</Button>
                  </SignOutButton>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="border-rezia-blue text-rezia-blue hover:bg-rezia-blue/10">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-rezia-blue hover:bg-rezia-blue/90">
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-rezia-blue focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
          {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rezia-blue"
            >
              Home
            </Link>
            <Link
              href="#features"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rezia-blue"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rezia-blue"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-rezia-blue"
            >
              Pricing
            </Link>

          </div>
            <div className="pt-4 pb-3 border-t border-gray-200 flex flex-col space-y-2 px-3">
              {isSignedIn ? (
                <>
                  {/* Dashboard link for signed-in users (mobile) */}
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <SignOutButton>
                    <Button className="w-full justify-center" variant="outline">
                      Sign Out
                    </Button>
                  </SignOutButton>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full justify-center border-rezia-blue text-rezia-blue hover:bg-rezia-blue/10">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full justify-center bg-rezia-blue hover:bg-rezia-blue/90">
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
