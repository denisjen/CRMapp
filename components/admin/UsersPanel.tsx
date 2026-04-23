'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, UserCheck, UserX } from 'lucide-react';
import { UserForm } from './UserForm';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  dept_id: number;
  dept_name: string;
  org_name: string;
  created_at: string;
}

const ROLE_LABEL: Record<string, string> = { admin: '管理員', manager: '主管', sales: '業務' };

export function UsersPanel() {
  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState<AdminUser | null>(null);

  async function load() {
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(user: AdminUser) {
    const label = user.is_active ? '停用' : '啟用';
    if (!confirm(`確定要${label}「${user.name}」？`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: updated.is_active } : u));
    }
  }

  function openAdd()               { setEditing(null);  setFormOpen(true); }
  function openEdit(u: AdminUser)  { setEditing(u);     setFormOpen(true); }

  function handleSaved(saved: AdminUser) {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...prev[idx], ...saved };
        return next;
      }
      return [...prev, saved];
    });
    setFormOpen(false);
  }

  if (loading) return <p className="text-sm text-zinc-400 py-8 text-center">載入中...</p>;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-zinc-800">使用者 <span className="text-zinc-400 font-normal text-sm">({users.length})</span></h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-zinc-900 text-white text-sm px-3 py-2 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all"
        >
          <Plus size={15} /> 新增使用者
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {users.map(u => (
          <div
            key={u.id}
            className={`bg-white rounded-xl border px-4 py-3 flex items-start justify-between gap-3 transition-opacity ${
              u.is_active ? 'border-zinc-200' : 'border-zinc-100 opacity-50'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-zinc-900 text-sm">{u.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  u.role === 'admin'   ? 'bg-purple-100 text-purple-700' :
                  u.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                                        'bg-zinc-100 text-zinc-600'
                }`}>
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
                {!u.is_active && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">已停用</span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{u.email}</p>
              <p className="text-xs text-zinc-400">{u.org_name} · {u.dept_name}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => openEdit(u)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                title="編輯"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => toggleActive(u)}
                className={`p-2 rounded-lg transition-colors ${
                  u.is_active
                    ? 'text-zinc-400 hover:text-red-500 hover:bg-red-50'
                    : 'text-zinc-400 hover:text-green-600 hover:bg-green-50'
                }`}
                title={u.is_active ? '停用' : '啟用'}
              >
                {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <UserForm
        open={formOpen}
        user={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
