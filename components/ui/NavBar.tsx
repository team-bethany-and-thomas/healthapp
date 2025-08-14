"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../app/hooks/useAuth';
import Image from "next/image";

const NavBar = () => {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [showAuthMessage, setShowAuthMessage] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isLoading) {
      return; // Don't do anything while loading
    }
    
    if (user) {
      // User is logged in - redirect to dashboard
      router.push('/dashboard');
    } else {
      // User is not logged in - show message and redirect to login
      setShowAuthMessage(true);
      setTimeout(() => {
        setShowAuthMessage(false);
        router.push('/login');
      }, 2000);
    }
  };

  const renderAuthButtons = () => {
    if (isLoading) {
      return (
        <div className="flex gap-2">
          <div className="btn btn-disabled loading">Loading</div>
        </div>
      );
    }

    if (user) {
      // User is logged in - show logout button
      return (
        <div className="flex gap-2 items-center">
          <span className="text-sm hidden sm:inline">Welcome, {user.name}</span>
          <button className="btn btn-outline btn-error rounded-full" onClick={handleLogout}>
            Logout
          </button>
        </div>
      );
    } else {
      // User is not logged in - show login and register buttons
      return (
        <>
          <div className="flex gap-2">
            <Link href="/login" className="btn btn-outline btn-primary">
              Login
            </Link>
            <Link href="/register" className="btn btn-primary">
              Register
            </Link>
          </div>
        </>
      );
    }
  };

  return (
    <>
      {/* Auth Message Toast */}
      {showAuthMessage && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-content px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span>Please sign up or login to access the dashboard.</span>
            <button 
              onClick={() => setShowAuthMessage(false)}
              className="text-primary-content hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="navbar bg-white shadow-sm">
        <div className="navbar-start">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="Pulse Health Logo"
              width={200}
              height={50}
              className="inline-block"
            />
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
                <Link href="/contact" className="text-black hover:bg-gray-100 hover:rounded-lg transition-all duration-200">Contact</Link>
            </li>
            <li>
              <a 
                className="text-black cursor-pointer hover:text-primary hover:bg-gray-100 hover:rounded-lg transition-all duration-200" 
                onClick={handleDashboardClick}
              >
                Dashboard
              </a>
            </li>
            <li>
                <Link href="/about" className="text-black hover:bg-gray-100 hover:rounded-lg transition-all duration-200">About Us</Link>
            </li>
            <li>
              <Link href={"/search"} className="text-black hover:bg-gray-100 hover:rounded-lg transition-all duration-200">
                Search
              </Link>
            </li>
          </ul>
        </div>

        <div className="navbar-end">
          {/* Desktop auth buttons */}
          <div className="hidden lg:flex">{renderAuthButtons()}</div>
          
          {/* Mobile hamburger menu */}
          <div className="dropdown dropdown-end lg:hidden">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-white rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li>
                  <Link href="/contact" className="text-black hover:bg-gray-100 hover:rounded-lg transition-all duration-200">Contact</Link>
              </li>
              <li>
                <a 
                  className="text-black cursor-pointer hover:text-primary hover:bg-gray-100 hover:rounded-lg transition-all duration-200" 
                  onClick={handleDashboardClick}
                >
                  Dashboard
                </a>
              </li>
              <li>
                  <Link href="/about" className="text-black hover:bg-gray-100 hover:rounded-lg transition-all duration-200">About Us</Link>
              </li>
              <li>
                <Link href={"/search"} className="text-black hover:bg-gray-100 hover:rounded-lg transition-all duration-200">
                  Search
                </Link>
              </li>
              {/* Mobile auth buttons */}
              <div className="divider my-2"></div>
              <div className="px-4 pb-2">
                {isLoading ? (
                  <div className="btn btn-disabled loading">Loading</div>
                ) : user ? (
                  // User is logged in - show name and logout button vertically
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-center">Welcome, {user.name}</span>
                    <button className="btn btn-outline btn-error rounded-full" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                ) : (
                  // User is not logged in - show login and register buttons
                  <div className="flex gap-2">
                    <Link href="/login" className="btn btn-outline btn-primary">
                      Login
                    </Link>
                    <Link href="/register" className="btn btn-primary">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavBar;
