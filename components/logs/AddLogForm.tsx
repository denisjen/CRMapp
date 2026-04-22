'use client';

import { useState } from 'react';
import { ContactLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  dealId: number;
  onLogAdded: (log: ContactLog) => void;
}

export function AddLogForm({ dealId, onLogAdded }: Props) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);

    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId, content: content.trim() }),
    });

    if (res.ok) {
      const log: ContactLog = await res.json();
      onLogAdded(log);
      setContent('');
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Textarea
        placeholder="記錄今天的聯繫內容..."
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        className="resize-none text-base"
      />
      <Button
        type="submit"
        disabled={saving || !content.trim()}
        className="h-12 text-base w-full"
      >
        {saving ? '儲存中...' : '新增聯繫紀錄'}
      </Button>
    </form>
  );
}
