export interface Account {
  id: string;
  name: string;
  type: "bank" | "securities" | "crypto" | "mobile_pay" | "cash" | "other";
  currency: string;
  balance: number;
  color?: string;
  icon?: string;
  sort_order: number;
  is_active: number;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  type: "expense" | "income" | "both";
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  account_id: string;
  to_account_id?: string;
  category_id?: string;
  subcategory_id?: string;
  description?: string;
  payment_method?: string;
  tags?: string;
  is_recurring: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType = "expense" | "income" | "transfer";

export interface TransactionInput {
  date: string;
  type: TransactionType;
  amount: number;
  account_id: string;
  to_account_id?: string;
  category_id?: string;
  description?: string;
  payment_method?: string;
}

export interface AccountInput {
  name: string;
  type: string;
  currency?: string;
  balance?: number;
  color?: string;
  icon?: string;
  sort_order?: number;
  note?: string;
}

export interface AccountUpdateInput {
  id: string;
  name: string;
  type: string;
  currency?: string;
  balance: number;
  color?: string;
  icon?: string;
  note?: string;
}

export interface TransactionUpdateInput {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  account_id: string;
  to_account_id?: string;
  category_id?: string;
  description?: string;
  payment_method?: string;
}

export type Page = 'entry' | 'accounts' | 'dashboard' | 'transactions' | 'categories' | 'settings';

export interface DraftRow {
  id: string;
  date: string;
  type: TransactionType;
  amountStr: string;
  category_id: string;
  payment_method: string;
  description: string;
  to_account_id: string;
}
