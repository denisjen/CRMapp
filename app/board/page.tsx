import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default async function BoardPage() {
  const session = await getSession();
  if (!session.userId) redirect('/login');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-bold text-zinc-900">業務追蹤</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">{session.name}</span>
          {(session.role === 'manager' || session.role === 'admin') && (
            <a href="/manager" className="text-xs text-zinc-400 hover:text-zinc-700 px-2 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
              業績總覽
            </a>
          )}
          {session.role === 'admin' && (
            <a href="/admin" className="text-xs text-zinc-400 hover:text-zinc-700 px-2 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
              管理後台
            </a>
          )}
          <LogoutButton />
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-hidden">
        <KanbanBoard />
      </main>
    </div>
  );
}
