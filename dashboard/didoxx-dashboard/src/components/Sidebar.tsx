import Link from 'next/link';
import { Home, Menu, BarChart2, User, Package } from 'lucide-react';

const navItems = [
  { name: 'Browse Menu', href: '/menu', icon: <Menu className="w-5 h-5" /> },
  { name: 'Track Orders', href: '/track', icon: <Package className="w-5 h-5" /> },
  { name: 'Analytics', href: '/analytics', icon: <BarChart2 className="w-5 h-5" /> },
];

export default function Sidebar() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <aside className="w-64 min-h-screen bg-white/5 backdrop-blur-xs border-r border-white/10 p-6 flex flex-col justify-between">
      {/* Logo */}
      <div>
        <h1 className="text-2xl font-bold text-primary-500 mb-8 text-center">
          DIDOXX
        </h1>
        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors duration-200"
            >
              {item.icon}
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Profile Card */}
      <div className="mt-8 p-4 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
          <User className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground">Gourmet Diner</span>
          <span className="text-xs text-primary-300">Premium Member</span>
        </div>
      </div>
    </aside>
  );
}
