import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId) redirect('/login');
  if (session.role === 'sales') redirect('/board');

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <a href="/board" className="text-zinc-400 hover:text-zinc-700 text-sm">← 看板</a>
          <span className="text-zinc-300">|</span>
          <h1 className="text-lg font-bold text-zinc-900">業績總覽</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">{session.name}</span>
          {session.role === 'admin' && (
            <a href="/admin" className="text-xs text-zinc-400 hover:text-zinc-700 px-2 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">管理後台</a>
          )}
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 px-4 py-5 max-w-3xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
