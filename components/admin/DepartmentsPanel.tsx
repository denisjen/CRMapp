'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import type { DeptNode } from '@/lib/types';

interface Org { id: number; name: string; }

const LEVEL_SUGGESTIONS = ['部門', '部', '課', '組', '小組', '中心', '室'];
const inputCls = 'w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-zinc-400 focus:bg-white transition-colors';

export function DepartmentsPanel() {
  const [depts, setDepts]   = useState<DeptNode[]>([]);
  const [orgs, setOrgs]     = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState<DeptNode | null>(null);
  const [name, setName]         = useState('');
  const [levelName, setLevelName] = useState('部門');
  const [parentId, setParentId] = useState<string>('');   // '' = top-level
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

  function openAdd(parentNode?: DeptNode) {
    setEditing(null);
    setName('');
    setLevelName('部門');
    setParentId(parentNode ? String(parentNode.id) : '');
    setOrgId(parentNode ? String(parentNode.org_id) : (orgs[0] ? String(orgs[0].id) : ''));
    setError('');
    setFormOpen(true);
  }

  function openEdit(d: DeptNode) {
    setEditing(d);
    setName(d.name);
    setLevelName(d.level_name);
    setParentId(d.parent_id ? String(d.parent_id) : '');
    setOrgId(String(d.org_id));
    setError('');
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const body: Record<string, unknown> = {
      name: name.trim(),
      level_name: levelName.trim() || '部門',
      parent_id: parentId ? parseInt(parentId) : null,
      org_id: orgId ? parseInt(orgId) : null,
    };
    const url    = editing ? `/api/admin/departments/${editing.id}` : '/api/admin/departments';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) { await load(); setFormOpen(false); }
    else { setError((await res.json()).error ?? '儲存失敗'); }
    setSaving(false);
  }

  async function handleDelete(d: DeptNode) {
    if (!confirm(`確定刪除「${d.name}」？`)) return;
    const res = await fetch(`/api/admin/departments/${d.id}`, { method: 'DELETE' });
    if (res.ok) await load();
    else alert((await res.json()).error ?? '刪除失敗');
  }

  if (loading) return <p className="text-sm text-zinc-400 py-8 text-center">載入中...</p>;

  // Group by org for display
  const orgMap = new Map(orgs.map(o => [o.id, o.name]));

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-zinc-800">
          組織架構 <span className="text-zinc-400 font-normal text-sm">({depts.length})</span>
        </h2>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-1.5 bg-zinc-900 text-white text-sm px-3 py-2 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all"
        >
          <Plus size={15} /> 新增單位
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {depts.map(d => (
          <div
            key={d.id}
            className="bg-white rounded-xl border border-zinc-200 flex items-center justify-between gap-2 pr-2"
            style={{ marginLeft: `${d.depth * 20}px` }}
          >
            {/* Depth connector */}
            <div className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0">
              {d.depth > 0 && (
                <ChevronRight size={13} className="text-zinc-300 shrink-0" />
              )}
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                d.depth === 0 ? 'bg-zinc-900 text-white' :
                d.depth === 1 ? 'bg-zinc-200 text-zinc-700' :
                                'bg-zinc-100 text-zinc-500'
              }`}>
                {d.level_name}
              </span>
              <span className="text-sm font-medium text-zinc-900 truncate">{d.name}</span>
              <span className="text-xs text-zinc-400 shrink-0">{orgMap.get(d.org_id)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => openAdd(d)}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-zinc-700 hover:bg-zinc-100"
                title="新增子單位"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={() => openEdit(d)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                title="編輯"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleDelete(d)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50"
                title="刪除"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {depts.length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-8">尚無任何單位，請先新增</p>
        )}
      </div>

      {/* Form modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-zinc-900 mb-4">
              {editing ? '編輯單位' : '新增單位'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

              {/* Parent */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-600">上層單位</label>
                <select
                  value={parentId}
                  onChange={e => {
                    setParentId(e.target.value);
                    if (e.target.value) {
                      const parent = depts.find(d => d.id === parseInt(e.target.value));
                      if (parent) setOrgId(String(parent.org_id));
                    }
                  }}
                  className={inputCls}
                >
                  <option value="">（頂層，直屬組織）</option>
                  {depts
                    .filter(d => !editing || d.id !== editing.id)
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {'　'.repeat(d.depth)}{d.depth > 0 ? '└ ' : ''}{d.name}（{d.level_name}）
                      </option>
                    ))}
                </select>
              </div>

              {/* Org — shown only when top-level */}
              {!parentId && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600">所屬組織 *</label>
                  <select
                    value={orgId} onChange={e => setOrgId(e.target.value)}
                    className={inputCls} required={!parentId}
                  >
                    <option value="">請選擇組織</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}

              {/* Level name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-600">層級名稱</label>
                <div className="flex gap-1.5 flex-wrap mb-1">
                  {LEVEL_SUGGESTIONS.map(s => (
                    <button
                      key={s} type="button"
                      onClick={() => setLevelName(s)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        levelName === s
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  value={levelName}
                  onChange={e => setLevelName(e.target.value)}
                  className={inputCls}
                  placeholder="自訂層級名稱"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-600">單位名稱 *</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  required className={inputCls} placeholder="業務部" autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setFormOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">
                  取消
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50">
                  {saving ? '儲存中...' : '儲存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
