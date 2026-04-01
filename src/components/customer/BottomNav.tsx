'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, User } from 'lucide-react';
import { useCartCount } from '@/app/customer/CustomerContext';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartCount();

  const tabs = [
    { label: '홈', href: '/customer', icon: Home },
    { label: '장바구니', href: '/customer/cart', icon: ShoppingCart, badge: cartCount },
    { label: '마이페이지', href: '/customer/mypage', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/customer' && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition-colors',
                isActive ? 'text-rose-600' : 'text-gray-400'
              )}
            >
              <div className="relative">
                <tab.icon className={cn('w-6 h-6', isActive && 'fill-current')} strokeWidth={isActive ? 2.5 : 1.8} />
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 cart-badge-animate">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', isActive ? 'text-rose-600' : 'text-gray-400')}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
