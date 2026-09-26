"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="nav">
      <Link href="/" className="brand" onClick={() => setIsOpen(false)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Dhaka Tesla Pool
      </Link>
      
      <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>

      <nav className={`nav-links ${isOpen ? 'open' : ''}`}>
        {user?.role === "PASSENGER" && (
          <>
            <Link href="/passenger" onClick={() => setIsOpen(false)}>Request Ride</Link>
            <Link href="/passenger/history" onClick={() => setIsOpen(false)}>History</Link>
          </>
        )}
        {user?.role === "DRIVER" && (
          <Link href="/driver" onClick={() => setIsOpen(false)}>Dashboard</Link>
        )}
        
        {user ? (
          <div className="user-dropdown" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</span>
            <button className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={() => { 
              logout(); 
              setIsOpen(false); 
              window.location.href = "/"; // Force hard redirect to clear all state and cache
            }}>
              Sign out
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary" onClick={() => setIsOpen(false)}>
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
