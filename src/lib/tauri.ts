import { invoke } from "@tauri-apps/api/core";
import type { Account, AccountInput, AccountUpdateInput, Category, Transaction, TransactionInput, TransactionUpdateInput } from "@/types";

export async function getAccounts(): Promise<Account[]> {
  return invoke("get_accounts");
}

export async function createAccount(input: AccountInput): Promise<Account> {
  return invoke("create_account", { input });
}

export async function updateAccount(input: AccountUpdateInput): Promise<Account> {
  return invoke("update_account", { input });
}

export async function deleteAccount(id: string): Promise<void> {
  return invoke("delete_account", { id });
}

export async function getCategories(): Promise<Category[]> {
  return invoke("get_categories");
}

export async function getTransactions(
  accountId?: string,
  yearMonth?: string
): Promise<Transaction[]> {
  // Tauri v2 はJS側をcamelCaseで受け取りRust側のsnake_caseに自動変換する
  const payload = {
    accountId: accountId ?? null,
    yearMonth: yearMonth ?? null,
  };
  console.log("[getTransactions] payload=", JSON.stringify(payload));
  return invoke("get_transactions", payload);
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  return invoke("create_transaction", { input });
}

export async function createTransactionsBulk(
  inputs: TransactionInput[]
): Promise<Transaction[]> {
  return invoke("create_transactions_bulk", { inputs });
}

export async function updateTransactionsBulk(updates: TransactionUpdateInput[]): Promise<void> {
  return invoke("update_transactions_bulk", { updates });
}

export async function deleteTransaction(id: string): Promise<void> {
  return invoke("delete_transaction", { id });
}

export async function getSettings(): Promise<Record<string, string>> {
  return invoke("get_settings");
}

export async function saveSetting(key: string, value: string): Promise<void> {
  return invoke("save_setting", { key, value });
}
