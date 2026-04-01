'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ShoppingBag, Calendar, Scissors,
  RefreshCw, Package, BarChart2, Settings, LogOut, Menu, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/orders', label: '주문 관리', icon: ShoppingBag },
  { href: '/admin/reservations', label: '예약 관리', icon: Calendar },
  { href: '/admin/repairs', label: '수선 관리', icon: Scissors },
  { href: '/admin/exchange', label: '환불/교환', icon: RefreshCw },
  { href: '/admin/inventory', label: '재고 관리', icon: Package },
  { href: '/admin/statistics', label: '판매 통계', icon: BarChart2 },
  { href: '/admin/products', label: '상품 관리', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 로그인 체크
  useEffect(() => {
    if (pathname === '/admin') return;
    const auth = sessionStorage.getItem('admin_auth');
    const authTime = parseInt(sessionStorage.getItem('admin_auth_time') ?? '0');
    const expired = Date.now() - authTime > 8 * 60 * 60 * 1000; // 8시간
    if (!auth || expired) {
      sessionStorage.removeItem('admin_auth');
      router.replace('/admin');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_auth_time');
    router.push('/admin');
  };

  if (pathname === '/admin') return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 사이드바 */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300',
        'lg:relative lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <p className="font-black text-white">스마트학생복</p>
            <p className="text-xs text-white/50">관리자 시스템</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-rose-600 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-sm font-medium w-full"
          >
            <LogOut className="w-5 h-5" /> 로그아웃
          </button>
        </div>
      </aside>

      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 상단바 */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">실시간 연결됨</span>
          </div>
        </header>

        {/* 페이지 내용 */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
