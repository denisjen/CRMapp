'use client';

import { Plus } from 'lucide-react';

interface Props {
  onClick: () => void;
}

export function AddDealButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xl active:scale-95 transition-transform hover:bg-zinc-700"
      aria-label="新增案件"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}
