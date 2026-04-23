'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';

interface Org { id: number; name: string; created_at: string; }

export function OrganizationsPanel() {
  const [orgs, setOrgs]         = useState<Org[]>([]);
  const [loading, setLoading]   = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState<Org | null>(null);
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  async function load() {
    const res = await fetch('/api/admin/organizations');
    if (res.ok) setOrgs(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd()           { setEditing(null); setName(''); setError(''); setFormOpen(true); }
  function openEdit(o: Org)    { setEditing(o); setName(o.name); setError(''); setFormOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const url    = editing ? `/api/admin/organizations/${editing.id}` : '/api/admin/organizations';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      await load();
      setFormOpen(false);
    } else {
      const data = await res.json();
      setError(data.error ?? '儲存失敗');
    }
    setSaving(false);
  }

  function formatDate(iso: string) {
    const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    return d.toLocaleDateString('zh-TW');
  }

  if (loading) return <p className="text-sm text-zinc-400 py-8 text-center">載入中...</p>;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-zinc-800">組織 <span className="text-zinc-400 font-normal text-sm">({orgs.length})</span></h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-zinc-900 text-white text-sm px-3 py-2 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all"
        >
          <Plus size={15} /> 新增組織
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {orgs.map(o => (
          <div key={o.id} className="bg-white rounded-xl border border-zinc-200 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">{o.name}</p>
              <p className="text-xs text-zinc-400">建立於 {formatDate(o.created_at)}</p>
            </div>
            <button onClick={() => openEdit(o)} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100">
              <Pencil size={15} />
            </button>
          </div>
        ))}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setFormOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-zinc-900 mb-4">{editing ? '編輯組織' : '新增組織'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-600">組織名稱 *</label>
                <input
                  value={name} onChange={e => setName(e.target.value)} required autoFocus
                  className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                  placeholder="我的公司"
                />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">取消</button>
                <button type="submit" disabled={saving} className="flex-1 h-11 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50">{saving ? '儲存中...' : '儲存'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
