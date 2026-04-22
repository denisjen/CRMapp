import { KanbanBoard } from '@/components/board/KanbanBoard';

export default function BoardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-bold text-zinc-900">業務追蹤</h1>
        <span className="text-xs text-zinc-400">左右滑動切換看板</span>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-hidden">
        <KanbanBoard />
      </main>
    </div>
  );
}
