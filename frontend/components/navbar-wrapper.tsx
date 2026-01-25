'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { useEffect, useState } from 'react';

export function NavbarWrapper() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Return empty fragment during SSR to prevent hydration issues
  if (!mounted) {
    return <></>;
  }
  
  // Don't render navbar on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }
  
  return <Navbar />;
}

