export type TeamRole = 'owner' | 'admin' | 'user';

export interface Team {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  joined_at: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: string | null;
  token: string;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  accepted: boolean;
}

export interface TeamSharedItem {
  id: string;
  team_id: string;
  shared_by: string;
  sharer_name: string | null;
  item_type: string;
  item_id: string | null;
  share_mode: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TeamNote {
  id: string;
  team_id: string;
  user_id: string;
  author_name: string | null;
  item_id: string;
  content: string;
  created_at: string;
}

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Propriétaire',
  admin: 'Manager',
  user: 'Barman',
};

export const ROLE_COLORS: Record<TeamRole, string> = {
  owner: 'text-[var(--gold)] bg-[var(--gold)]/10',
  admin: 'text-blue-400 bg-blue-400/10',
  user: 'text-[var(--text-dim)] bg-[var(--surface2)]',
};

/** Resolve the effective role of a member given the team owner. */
export function memberRole(
  member: { user_id: string; role?: string | null },
  ownerId: string
): TeamRole {
  if (member.user_id === ownerId) return 'owner';
  if (member.role === 'admin' || member.role === 'manager') return 'admin';
  return 'user';
}

/** Unambiguous 6-char join code (no 0/O/1/I/L). Browser-only (crypto). */
export function generateTeamCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(6);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[arr[i] % chars.length];
  return out;
}

export function randomToken(): string {
  const arr = new Uint32Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => n.toString(36)).join('');
}
