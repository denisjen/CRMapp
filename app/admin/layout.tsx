import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { AdminNav } from '@/components/admin/AdminNav';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId) redirect('/login');
  if (session.role !== 'admin') redirect('/board');

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <a href="/board" className="text-zinc-400 hover:text-zinc-700 text-sm">← 看板</a>
          <span className="text-zinc-300">|</span>
          <h1 className="text-lg font-bold text-zinc-900">管理後台</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">{session.name}</span>
          <LogoutButton />
        </div>
      </header>

      {/* Tab Nav */}
      <AdminNav />

      {/* Content */}
      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
