'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/admin/users',         label: '使用者' },
  { href: '/admin/departments',   label: '部門' },
  { href: '/admin/organizations', label: '組織' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="bg-white border-b border-zinc-200 px-4">
      <div className="flex gap-0 max-w-2xl mx-auto">
        {tabs.map(t => (
          <Link
            key={t.href}
            href={t.href}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              pathname.startsWith(t.href)
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
