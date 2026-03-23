export * from '../../apps/api/node_modules/@prisma/client';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  userId: string;
  budget?: number | null;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string | Date; // ISO string when sent in JSON
  userId: string;
  categoryId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  // Included category from Prisma relation
  category?: {
    name: string;
    type: TransactionType;
  };
}

export interface CategoryBudgetProgress {
  categoryId: string;
  categoryName: string;
  budget: number;
  spent: number;
  percentage: number;
}

export interface TransactionSummary {
  INCOME: number;
  EXPENSE: number;
  BALANCE: number;
  BUDGETS?: CategoryBudgetProgress[];
}

export interface CreateTransactionRequest {
  amount: number;
  type: TransactionType;
  description?: string;
  categoryId: string;
}

export interface CreateCategoryRequest {
  name: string;
  type: TransactionType;
  budget?: number | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  type?: TransactionType;
  budget?: number | null;
}

export interface AuthResponse {
  access_token: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
}