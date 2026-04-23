'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Dept { id: number; name: string; org_id: number; org_name: string; }
interface Org  { id: number; name: string; }

export function DepartmentsPanel() {
  const [depts, setDepts]       = useState<Dept[]>([]);
  const [orgs, setOrgs]         = useState<Org[]>([]);
  const [loading, setLoading]   = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState<Dept | null>(null);
  const [name, setName]         = useState('');
  const [orgId, setOrgId]       = useState('');
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  async function load() {
    const [d, o] = await Promise.all([
      fetch('/api/admin/departments').then(r => r.json()),
      fetch('/api/admin/organizations').then(r => r.json()),
    ]);
    setDepts(d); setOrgs(o); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd()            { setEditing(null); setName(''); setOrgId(orgs[0]?.id ? String(orgs[0].id) : ''); setError(''); setFormOpen(true); }
  function openEdit(d: Dept)    { setEditing(d); setName(d.name); setOrgId(String(d.org_id)); setError(''); setFormOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) { setError('請選擇組織'); return; }
    setSaving(true); setError('');
    const url    = editing ? `/api/admin/departments/${editing.id}` : '/api/admin/departments';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), org_id: parseInt(orgId) }),
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

  async function handleDelete(d: Dept) {
    if (!confirm(`確定刪除「${d.name}」？`)) return;
    const res = await fetch(`/api/admin/departments/${d.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDepts(prev => prev.filter(x => x.id !== d.id));
    } else {
      const data = await res.json();
      alert(data.error ?? '刪除失敗');
    }
  }

  if (loading) return <p className="text-sm text-zinc-400 py-8 text-center">載入中...</p>;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-zinc-800">部門 <span className="text-zinc-400 font-normal text-sm">({depts.length})</span></h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-zinc-900 text-white text-sm px-3 py-2 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all"
        >
          <Plus size={15} /> 新增部門
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {depts.map(d => (
          <div key={d.id} className="bg-white rounded-xl border border-zinc-200 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">{d.name}</p>
              <p className="text-xs text-zinc-400">{d.org_name}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(d)} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(d)} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Inline form modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setFormOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-zinc-900 mb-4">{editing ? '編輯部門' : '新增部門'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-600">所屬組織 *</label>
                <select value={orgId} onChange={e => setOrgId(e.target.value)} className={inputCls} required>
                  <option value="">請選擇組織</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-600">部門名稱 *</label>
                <input value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="業務部" autoFocus />
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

const inputCls = 'w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-zinc-400 focus:bg-white transition-colors';
