'use client';

import { useState } from 'react';
import { ApiDeal, ColumnId } from '@/lib/types';
import { COLUMNS } from '@/lib/constants';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (deal: ApiDeal) => void;
  defaultColumn?: ColumnId;
}

export function AddDealModal({ open, onClose, onCreated, defaultColumn = 'developing' }: Props) {
  const [customer, setCustomer] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [columnId, setColumnId] = useState<ColumnId>(defaultColumn);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer.trim()) return;
    setSaving(true);

    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: customer.trim(),
        contact_person: contactPerson.trim(),
        amount: parseFloat(amount) || 0,
        column_id: columnId,
      }),
    });

    if (res.ok) {
      const deal: ApiDeal = await res.json();
      onCreated(deal);
      setCustomer('');
      setContactPerson('');
      setAmount('');
      setColumnId('developing');
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>新增案件</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer">客戶名稱 *</Label>
            <Input
              id="customer"
              placeholder="例：王總、台積電採購部"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact_person">聯絡人</Label>
            <Input
              id="contact_person"
              placeholder="例：王小明、採購部陳經理"
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">預估金額（TWD）</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={0}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>放入看板</Label>
            <div className="flex gap-2">
              {COLUMNS.map(col => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setColumnId(col.id)}
                  className={`
                    flex-1 rounded-lg py-2 text-sm font-medium border transition-colors
                    ${columnId === col.id
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'}
                  `}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={saving || !customer.trim()} className="mt-2 h-12 text-base">
            {saving ? '新增中...' : '新增案件'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
