export type ColumnId = 'developing' | 'quoting' | 'closed';
export type UserRole = 'admin' | 'manager' | 'sales';

export interface Organization {
  id: number;
  name: string;
  created_at: string;
}

export interface Department {
  id: number;
  org_id: number;
  parent_id: number | null;
  level_name: string;
  name: string;
  created_at: string;
}

/** Department enriched with tree info (returned by admin/manager APIs) */
export interface DeptNode extends Department {
  org_name: string;
  depth: number;
  /** slash-separated path from root, e.g. "業務部/北區課/第一組" */
  sort_path: string;
}

export interface User {
  id: number;
  dept_id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Deal {
  id: number;
  user_id: number;
  customer: string;
  contact_person: string;
  amount: number;
  column_id: ColumnId;
  position: number;
  notes: string;
  last_contact_at: string;
  created_at: string;
}

export interface ApiDeal extends Deal {
  isStale: boolean;
  daysSinceContact: number;
}

export interface ContactLog {
  id: number;
  deal_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface BoardData {
  developing: ApiDeal[];
  quoting: ApiDeal[];
  closed: ApiDeal[];
}
