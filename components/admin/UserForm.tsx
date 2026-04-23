'use client';

import { useState, useEffect } from 'react';
import { AdminUser } from './UsersPanel';

interface Dept { id: number; name: string; org_name: string; depth: number; sort_path: string; }

interface Props {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}

const ROLES = [
  { value: 'admin',   label: '管理員' },
  { value: 'manager', label: '主管' },
  { value: 'sales',   label: '業務' },
];

export function UserForm({ open, user, onClose, onSaved }: Props) {
  const [depts, setDepts]       = useState<Dept[]>([]);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [role, setRole]         = useState('sales');
  const [deptId, setDeptId]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    fetch('/api/admin/departments').then(r => r.json()).then(setDepts);
  }, []);

  useEffect(() => {
    if (open) {
      setName(user?.name ?? '');
      setEmail(user?.email ?? '');
      setRole(user?.role ?? 'sales');
      setDeptId(user?.dept_id ? String(user.dept_id) : '');
      setPassword('');
      setError('');
    }
  }, [open, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!deptId) { setError('請選擇部門'); return; }
    if (!user && !password) { setError('新增使用者時須設定密碼'); return; }
    setSaving(true);

    const body: Record<string, unknown> = {
      name: name.trim(), email: email.trim(), role, dept_id: parseInt(deptId),
    };
    if (password) body.password = password;

    const url    = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
    const method = user ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const saved = await res.json();
      // Merge dept info for display
      const dept = depts.find(d => d.id === parseInt(deptId));
      onSaved({ ...saved, dept_name: dept?.name ?? '', org_name: dept?.org_name ?? '' });
    } else {
      const data = await res.json();
      setError(data.error ?? '儲存失敗');
    }
    setSaving(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-zinc-900 mb-4">
          {user ? '編輯使用者' : '新增使用者'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="姓名 *">
            <input
              value={name} onChange={e => setName(e.target.value)} required
              className={inputCls} placeholder="王小明"
            />
          </Field>

          <Field label="Email *">
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className={inputCls} placeholder="user@company.com"
            />
          </Field>

          <Field label="角色 *">
            <div className="flex gap-2">
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    role === r.value ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="所屬單位 *">
            <select value={deptId} onChange={e => setDeptId(e.target.value)} className={inputCls} required>
              <option value="">請選擇單位</option>
              {depts.map(d => (
                <option key={d.id} value={d.id}>
                  {'　'.repeat(d.depth)}{d.depth > 0 ? '└ ' : ''}{d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={user ? '重設密碼（選填）' : '密碼 *'}>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required={!user} className={inputCls} placeholder={user ? '留空則不變更' : '至少 6 字元'}
              minLength={6}
            />
          </Field>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              取消
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-11 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 disabled:opacity-50"
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = 'w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-zinc-400 focus:bg-white transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600">{label}</label>
      {children}
    </div>
  );
}
