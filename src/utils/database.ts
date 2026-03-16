import { getSupabase } from './supabase';
import { Project, Receipt } from '../types';

// ==================== Auth ========================

export const signInWithEmail = async (email: string): Promise<{ error: string | null }> => {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase가 설정되지 않았습니다.' };

  const redirectTo = window.location.origin + '/';
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  return { error: error?.message || null };
};

export const signOut = async () => {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
};

export const getSession = async () => {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => data.subscription.unsubscribe();
};

// ==================== Projects ====================

export const dbFetchProjects = async (userId: string): Promise<Project[]> => {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await (sb
    .from('projects') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(rowToProject);
};

export const dbCreateProject = async (
  userId: string,
  project: Omit<Project, 'receipts'>
): Promise<Project | null> => {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await (sb
    .from('projects') as any)
    .insert(projectToRow(userId, project))
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return rowToProject(data);
};

export const dbUpdateProject = async (
  projectId: string,
  updates: Partial<Project>
): Promise<boolean> => {
  const sb = getSupabase();
  if (!sb) return false;
  const row: any = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.totalBudget !== undefined) row.total_budget = updates.totalBudget;
  if (updates.color !== undefined) row.color = updates.color;
  if (updates.icon !== undefined) row.icon = updates.icon;
  if (updates.showBudget !== undefined) row.show_budget = updates.showBudget;
  if (updates.budgetRules !== undefined) row.budget_rules = updates.budgetRules;
  if (updates.tableColumns !== undefined) row.table_columns = updates.tableColumns;
  const { error } = await (sb.from('projects') as any).update(row).eq('id', projectId);
  if (error) { console.error(error); return false; }
  return true;
};

export const dbDeleteProject = async (projectId: string): Promise<boolean> => {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await (sb.from('projects') as any).delete().eq('id', projectId);
  if (error) { console.error(error); return false; }
  return true;
};

// ==================== Receipts ====================

export const dbFetchReceipts = async (projectId: string): Promise<Receipt[]> => {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await (sb
    .from('receipts') as any)
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(rowToReceipt);
};

export const dbCreateReceipt = async (
  userId: string,
  receipt: Receipt
): Promise<Receipt | null> => {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await (sb
    .from('receipts') as any)
    .insert({
      id: receipt.id,
      project_id: receipt.projectId,
      user_id: userId,
      store_name: receipt.storeName,
      date: receipt.date,
      total_amount: receipt.totalAmount,
      image_url: receipt.imageUrl || null,
      items: receipt.items,
    })
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return rowToReceipt(data);
};

export const dbDeleteReceipt = async (receiptId: string): Promise<boolean> => {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await (sb.from('receipts') as any).delete().eq('id', receiptId);
  if (error) { console.error(error); return false; }
  return true;
};

// ==================== Row 변환 ====================

function rowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    totalBudget: row.total_budget || 0,
    usedAmount: 0, // 계산됨
    color: row.color || '#6366f1',
    icon: row.icon || '📁',
    showBudget: row.show_budget ?? true,
    budgetRules: row.budget_rules || [],
    tableColumns: row.table_columns || [],
    createdAt: row.created_at,
    receipts: [],
  };
}

function projectToRow(userId: string, p: Omit<Project, 'receipts'>) {
  return {
    id: p.id,
    user_id: userId,
    name: p.name,
    description: p.description || '',
    total_budget: p.totalBudget,
    color: p.color,
    icon: p.icon,
    show_budget: p.showBudget,
    budget_rules: p.budgetRules,
    table_columns: p.tableColumns,
  };
}

function rowToReceipt(row: any): Receipt {
  return {
    id: row.id,
    projectId: row.project_id,
    storeName: row.store_name,
    date: row.date,
    totalAmount: row.total_amount || 0,
    imageUrl: row.image_url,
    items: row.items || [],
    createdAt: row.created_at,
  };
}
