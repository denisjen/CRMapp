'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 px-2 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
      title="登出"
    >
      <LogOut size={15} />
      <span>登出</span>
    </button>
  );
}
