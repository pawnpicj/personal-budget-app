export interface IncomeData {
  salary: number;
  bonus: number;
  sso: number;
  other: number;
  totalActual: number;
  difference: number;
}

export interface BudgetItem {
  rowIndex: number;
  category: string;
  item: string;
  plan: number;
  actual: number;
}

export interface MonthData {
  month: string;
  income: IncomeData;
  items: BudgetItem[];
}

export interface CategorySummary {
  category: string;
  planTotal: number;
  actualTotal: number;
  items: BudgetItem[];
}

export interface CategoryYearlySummary {
  category: string;
  planTotal: number;
  actualTotal: number;
}

export interface MonthSummary {
  month: string;
  salary: number;
  bonus: number;
  sso: number;
  other: number;
  balance: number;
  totalPlan: number;
  totalActual: number;
  difference: number;
  categories: CategoryYearlySummary[];
}
