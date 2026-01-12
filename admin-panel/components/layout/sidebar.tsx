'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  GitBranch, 
  Bot, 
  FileText, 
  Network, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  Database,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Activity,
  PlayCircle,
  ShoppingBag,
  Trophy,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: GitBranch },
  { name: 'AI Agents', href: '/agents', icon: Bot },
  { name: 'Activity Feed', href: '/feed', icon: Activity },
  { name: 'Replay Sessions', href: '/replay', icon: PlayCircle },
  { name: 'Pattern Marketplace', href: '/marketplace', icon: ShoppingBag },
  { name: 'Achievements', href: '/achievements', icon: Trophy },
  { name: 'Analytics', href: '/analytics-dashboard', icon: TrendingUp },
  { name: 'Decisions', href: '/decisions', icon: FileText },
  { name: 'Knowledge Graph', href: '/knowledge', icon: Network },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'System', href: '/system', icon: Database },
  { name: 'Settings', href: '/admin', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white flex flex-col transition-all duration-300`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🌊</span>
            </div>
            <span className="font-bold text-lg">OCEAN</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-slate-800 rounded"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-cyan-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
              title={collapsed ? item.name : ''}
            >
              <item.icon size={20} />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800">
        {!collapsed ? (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">{session?.user?.name?.[0] || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{session?.user?.email || 'Not logged in'}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center mx-auto">
            <span className="text-sm font-bold">{session?.user?.name?.[0] || 'U'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
