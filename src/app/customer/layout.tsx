'use client';

import { CustomerProvider } from './CustomerContext';
import BottomNav from '@/components/customer/BottomNav';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerProvider>
      <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto relative">
        <main className="pb-20">
          {children}
        </main>
        <BottomNav />
      </div>
    </CustomerProvider>
  );
}
