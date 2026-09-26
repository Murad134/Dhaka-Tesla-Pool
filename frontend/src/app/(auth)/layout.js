"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }) {
  const pathname = usePathname();
  const isRegister = pathname === "/register";

  return (
    <main className="auth-wrapper">
      <div className="card-glass auth-card">
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', borderBottom: '1px solid var(--border-strong)' }}>
          <Link 
            href="/login" 
            style={{ 
              paddingBottom: '12px', 
              color: !isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: !isRegister ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: '600'
            }}
          >
            Sign in
          </Link>
          <Link 
            href="/register" 
            style={{ 
              paddingBottom: '12px', 
              color: isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: isRegister ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: '600'
            }}
          >
            Create account
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}
