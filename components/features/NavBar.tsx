"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../app/hooks/useAuth';
import Image from "next/image";

const NavBar = () => {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
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
          <span className="text-sm hidden sm:inline">
            Welcome, {user.name}
          </span>
          <button 
            className="btn btn-outline btn-error"
            onClick={handleLogout}
          >
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
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
              <li><a>Item 1</a></li>
              <li>
                <a>Parent</a>
                <ul className="p-2">
                  <li><a>Submenu 1</a></li>
                  <li><a>Submenu 2</a></li>
                </ul>
              </li>
              <li><a>Item 3</a></li>
              {/* Mobile auth buttons */}
              <div className="divider lg:hidden my-2"></div>
              <div className="px-4 pb-2 lg:hidden">
                {renderAuthButtons()}
              </div>
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost text-xl">  
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
            <li><a>Item 1</a></li>
            <li>
              <details>
                <summary>Parent</summary>
                <ul className="p-2">
                  <li><a>Submenu 1</a></li>
                  <li><a>Submenu 2</a></li>
                </ul>
              </details>
            </li>
            <li><a>Item 3</a></li>
          </ul>
        </div>
        
        <div className="navbar-end hidden lg:flex">
          {renderAuthButtons()}
        </div>
      </div>
    </>
  );
};

export default NavBar;