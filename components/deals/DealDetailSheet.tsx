'use client';

import { useState, useEffect } from 'react';
import { ApiDeal, ContactLog } from '@/lib/types';
import { COLUMNS } from '@/lib/constants';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContactLogList } from '../logs/ContactLogList';
import { AddLogForm } from '../logs/AddLogForm';
import { StaleIndicator } from '../board/StaleIndicator';
import { Trash2, Pencil, Check, X } from 'lucide-react';

interface Props {
  deal: ApiDeal;
  open: boolean;
  onClose: () => void;
  onUpdated: (deal: ApiDeal) => void;
  onDeleted: (id: number) => void;
}

export function DealDetailSheet({ deal, open, onClose, onUpdated, onDeleted }: Props) {
  const [logs, setLogs] = useState<ContactLog[]>([]);
  const [editing, setEditing] = useState(false);
  const [customer, setCustomer] = useState(deal.customer);
  const [amount, setAmount] = useState(String(deal.amount));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setCustomer(deal.customer);
      setAmount(String(deal.amount));
      setEditing(false);
      fetch(`/api/logs/${deal.id}`)
        .then(r => r.json())
        .then(setLogs);
    }
  }, [open, deal.id, deal.customer, deal.amount]);

  const columnLabel = COLUMNS.find(c => c.id === deal.column_id)?.label ?? deal.column_id;

  async function handleSaveEdit() {
    if (!customer.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/deals/${deal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: customer.trim(), amount: parseFloat(amount) || 0 }),
    });
    if (res.ok) {
      const updated: ApiDeal = await res.json();
      onUpdated(updated);
    }
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`確定要刪除「${deal.customer}」這個案件嗎？`)) return;
    setDeleting(true);
    const res = await fetch(`/api/deals/${deal.id}`, { method: 'DELETE' });
    if (res.ok) onDeleted(deal.id);
    setDeleting(false);
  }

  function handleLogAdded(log: ContactLog) {
    setLogs(prev => [log, ...prev]);
    // Optimistically update last_contact_at in parent
    const updated: ApiDeal = {
      ...deal,
      notes: log.content,
      last_contact_at: log.created_at,
      isStale: false,
      daysSinceContact: 0,
    };
    onUpdated(updated);
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="h-[90dvh] flex flex-col rounded-t-2xl px-0" showCloseButton={false}>
        <SheetHeader className="px-5 pb-2 border-b border-zinc-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {editing ? (
                <Input
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  className="text-xl font-bold h-10"
                  autoFocus
                />
              ) : (
                <SheetTitle className="text-xl text-left">{deal.customer}</SheetTitle>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-400 bg-zinc-100 rounded px-2 py-0.5">{columnLabel}</span>
                {deal.isStale && <StaleIndicator daysSinceContact={deal.daysSinceContact} />}
              </div>
            </div>

            {/* Action buttons + close */}
            <div className="flex items-center gap-3 shrink-0">
              {editing ? (
                <>
                  <button onClick={handleSaveEdit} disabled={saving} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check size={20} />
                  </button>
                  <button onClick={() => setEditing(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg">
                    <X size={20} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg">
                    <Pencil size={18} />
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                  {/* Divider + close */}
                  <div className="w-px h-5 bg-zinc-200" />
                  <button onClick={onClose} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg">
                    <X size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Amount */}
          {editing ? (
            <div className="mt-2">
              <Label className="text-xs text-zinc-500">預估金額（TWD）</Label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="mt-1"
                min={0}
              />
            </div>
          ) : (
            deal.amount > 0 && (
              <p className="text-sm text-zinc-600 mt-1">
                預估金額：<span className="font-semibold">${deal.amount.toLocaleString()}</span>
              </p>
            )
          )}
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
          {/* Add log form */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">新增聯繫紀錄</h3>
            <AddLogForm dealId={deal.id} onLogAdded={handleLogAdded} />
          </div>

          {/* Log history */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">聯繫紀錄</h3>
            <ContactLogList logs={logs} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
