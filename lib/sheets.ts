import { google, sheets_v4 } from "googleapis";
import type { MonthData, BudgetItem, IncomeData, MonthSummary, InstallmentPlan, InstallmentRow } from "./types";

const SPREADSHEET_ID = process.env.SHEET_ID!;
const TEMPLATE_SHEET_NAME = "_Template";
const SETTINGS_SHEET_NAME = "_Settings";
const ITEM_FIRST_ROW = 11;
const ITEM_LAST_ROW = 300;
const MONTH_LABEL_PATTERN = /^\d{2}-\d{4}$/;

function sheetsClient(accessToken: string): sheets_v4.Sheets {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth });
}

async function getSheetIdByName(
  client: sheets_v4.Sheets,
  title: string
): Promise<number | null> {
  const meta = await client.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === title);
  return sheet?.properties?.sheetId ?? null;
}

export async function deleteMonthSheet(accessToken: string, month: string): Promise<void> {
  if (!MONTH_LABEL_PATTERN.test(month)) {
    throw new Error("Month label must be in MM-YYYY format");
  }
  const client = sheetsClient(accessToken);
  const sheetId = await getSheetIdByName(client, month);
  if (sheetId === null) throw new Error(`Sheet "${month}" not found`);

  await client.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ deleteSheet: { sheetId } }] },
  });
}

export async function listMonths(accessToken: string): Promise<string[]> {
  const client = sheetsClient(accessToken);
  const meta = await client.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const titles = (meta.data.sheets ?? [])
    .filter((s) => !s.properties?.hidden && MONTH_LABEL_PATTERN.test(s.properties?.title ?? ""))
    .map((s) => s.properties?.title ?? "");
  return titles.sort().reverse();
}

export async function copyMonthSheet(
  accessToken: string,
  fromMonth: string,
  toMonth: string
): Promise<void> {
  if (!MONTH_LABEL_PATTERN.test(fromMonth) || !MONTH_LABEL_PATTERN.test(toMonth)) {
    throw new Error("Month label must be in MM-YYYY format");
  }
  const source = await getMonthData(accessToken, fromMonth);
  await ensureMonthSheet(accessToken, toMonth);
  await updateIncome(accessToken, toMonth, {
    salary: source.income.salary,
    bonus: source.income.bonus,
    sso: source.income.sso,
    other: source.income.other,
  });
  if (source.items.length > 0) {
    const client = sheetsClient(accessToken);
    const values = source.items.map((item) => [item.category, item.item, item.plan, 0]);
    await client.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${toMonth}'!A${ITEM_FIRST_ROW}:D${ITEM_FIRST_ROW + values.length - 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  }
}

export async function hideMonthSheet(accessToken: string, month: string): Promise<void> {
  if (!MONTH_LABEL_PATTERN.test(month)) {
    throw new Error("Month label must be in MM-YYYY format");
  }
  const client = sheetsClient(accessToken);
  const sheetId = await getSheetIdByName(client, month);
  if (sheetId === null) throw new Error(`Sheet "${month}" not found`);
  await client.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ updateSheetProperties: { properties: { sheetId, hidden: true }, fields: "hidden" } }],
    },
  });
}

export async function ensureMonthSheet(accessToken: string, month: string): Promise<void> {
  if (!MONTH_LABEL_PATTERN.test(month)) {
    throw new Error("Month label must be in MM-YYYY format");
  }
  const client = sheetsClient(accessToken);
  const existingId = await getSheetIdByName(client, month);
  if (existingId !== null) return;

  const templateId = await getSheetIdByName(client, TEMPLATE_SHEET_NAME);
  if (templateId === null) {
    throw new Error(`Template sheet "${TEMPLATE_SHEET_NAME}" not found`);
  }

  const dup = await client.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ duplicateSheet: { sourceSheetId: templateId, newSheetName: month } }],
    },
  });

  const newSheetId =
    dup.data.replies?.[0]?.duplicateSheet?.properties?.sheetId ?? undefined;
  if (newSheetId === undefined) return;

  // Unhide the new sheet in case _Template was hidden (hidden flag is copied on duplicate)
  await client.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ updateSheetProperties: { properties: { sheetId: newSheetId, hidden: false }, fields: "hidden" } }],
    },
  });

  await client.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${month}'!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[`Personal Monthly Budget ${month}`]] },
  });
}

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function getMonthData(accessToken: string, month: string): Promise<MonthData> {
  await ensureMonthSheet(accessToken, month);
  const client = sheetsClient(accessToken);

  const range = `'${month}'!A1:G${ITEM_LAST_ROW}`;
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  const rows = res.data.values ?? [];

  const getCell = (r: number, c: number) => rows[r - 1]?.[c - 1];

  const income: IncomeData = {
    salary: toNumber(getCell(3, 2)),
    bonus: toNumber(getCell(4, 2)),
    sso: toNumber(getCell(5, 2)),
    other: toNumber(getCell(6, 2)),
    totalActual: toNumber(getCell(7, 2)),
    difference: toNumber(getCell(8, 2)),
  };

  const items: BudgetItem[] = [];
  for (let r = ITEM_FIRST_ROW; r <= ITEM_LAST_ROW; r++) {
    const category = getCell(r, 1);
    const name = getCell(r, 2);
    if (!category && !name) continue;
    items.push({
      rowIndex: r,
      category: String(category ?? "").trim(),
      item: String(name ?? "").trim(),
      plan: toNumber(getCell(r, 3)),
      actual: toNumber(getCell(r, 4)),
    });
  }

  return { month, income, items };
}

export async function updateIncome(
  accessToken: string,
  month: string,
  data: { salary: number; bonus: number; sso: number; other: number }
): Promise<void> {
  await ensureMonthSheet(accessToken, month);
  const client = sheetsClient(accessToken);
  await client.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${month}'!B3:B6`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[data.salary], [data.bonus], [data.sso], [data.other]],
    },
  });
}

async function findFirstEmptyItemRow(
  client: sheets_v4.Sheets,
  month: string
): Promise<number> {
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${month}'!A${ITEM_FIRST_ROW}:B${ITEM_LAST_ROW}`,
  });
  const rows = res.data.values ?? [];
  for (let i = 0; i < rows.length; i++) {
    const [cat, name] = rows[i] ?? [];
    if (!cat && !name) return ITEM_FIRST_ROW + i;
  }
  return ITEM_FIRST_ROW + rows.length;
}

export async function addItem(
  accessToken: string,
  month: string,
  item: { category: string; item: string; plan: number; actual: number }
): Promise<number> {
  await ensureMonthSheet(accessToken, month);
  const client = sheetsClient(accessToken);
  await ensureCategoryInSettings(accessToken, item.category);

  const row = await findFirstEmptyItemRow(client, month);
  await client.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${month}'!A${row}:D${row}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[item.category, item.item, item.plan, item.actual]] },
  });
  return row;
}

export async function updateItem(
  accessToken: string,
  month: string,
  rowIndex: number,
  item: { category: string; item: string; plan: number; actual: number }
): Promise<void> {
  await ensureMonthSheet(accessToken, month);
  const client = sheetsClient(accessToken);
  await ensureCategoryInSettings(accessToken, item.category);

  await client.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${month}'!A${rowIndex}:D${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[item.category, item.item, item.plan, item.actual]] },
  });
}

export async function deleteItem(
  accessToken: string,
  month: string,
  rowIndex: number
): Promise<void> {
  await ensureMonthSheet(accessToken, month);
  const client = sheetsClient(accessToken);
  await client.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${month}'!A${rowIndex}:D${rowIndex}`,
  });
}

export async function renameCategory(
  accessToken: string,
  month: string,
  oldName: string,
  newName: string
): Promise<void> {
  const data = await getMonthData(accessToken, month);
  const client = sheetsClient(accessToken);
  await ensureCategoryInSettings(accessToken, newName);

  const rowsToUpdate = data.items.filter((i) => i.category === oldName);
  if (rowsToUpdate.length === 0) return;

  const requests = rowsToUpdate.map((i) => ({
    range: `'${month}'!A${i.rowIndex}`,
    values: [[newName]],
  }));

  await client.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: "USER_ENTERED", data: requests },
  });
}

export async function initializeSpreadsheet(
  accessToken: string
): Promise<{ alreadyInitialized: boolean }> {
  const client = sheetsClient(accessToken);
  const meta = await client.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingTitles = (meta.data.sheets ?? []).map((s) => s.properties?.title ?? "");

  const hasTemplate = existingTitles.includes(TEMPLATE_SHEET_NAME);
  const hasSettings = existingTitles.includes(SETTINGS_SHEET_NAME);
  const alreadyInitialized = hasTemplate && hasSettings;

  const addRequests: sheets_v4.Schema$Request[] = [];
  if (!hasTemplate) addRequests.push({ addSheet: { properties: { title: TEMPLATE_SHEET_NAME } } });
  if (!hasSettings) addRequests.push({ addSheet: { properties: { title: SETTINGS_SHEET_NAME } } });
  if (addRequests.length > 0) {
    await client.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: addRequests },
    });
  }

  if (!hasTemplate) {
    await client.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${TEMPLATE_SHEET_NAME}'!A1:G14`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ["Personal Monthly Budget MM-YYYY"],
          [],
          ["Salary", 0],
          ["Bonus", 0],
          ["SSO", 0],
          ["Balance (ออกก่อน)", 0],
          ["Total Actual", 0],
          ["Difference", 0],
          [],
          ["Category", "Item", "Plan", "Actual", null, "Category", "Subtotal (Actual)"],
          [null, null, null, null, null, "General", 0],
          [null, null, null, null, null, "Booking", 0],
          [null, null, null, null, null, "Expenses", 0],
          [null, null, null, null, null, "Loan", 0],
        ],
      },
    });
  }

  if (!hasSettings) {
    await client.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SETTINGS_SHEET_NAME}'!A1:A5`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["Category"], ["General"], ["Booking"], ["Expenses"], ["Loan"]] },
    });
  }

  // Always ensure _Template and _Settings are hidden in Google Sheets
  const latestMeta = await client.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const hideRequests: sheets_v4.Schema$Request[] = [];
  for (const sheet of latestMeta.data.sheets ?? []) {
    const title = sheet.properties?.title ?? "";
    const sheetId = sheet.properties?.sheetId;
    if ((title === TEMPLATE_SHEET_NAME || title === SETTINGS_SHEET_NAME) && !sheet.properties?.hidden && sheetId != null) {
      hideRequests.push({ updateSheetProperties: { properties: { sheetId, hidden: true }, fields: "hidden" } });
    }
  }
  if (hideRequests.length > 0) {
    await client.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests: hideRequests } });
  }

  return { alreadyInitialized };
}

export async function listCategories(accessToken: string): Promise<string[]> {
  const client = sheetsClient(accessToken);
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SETTINGS_SHEET_NAME}'!A2:A50`,
  });
  const rows = res.data.values ?? [];
  return rows.map((r) => String(r[0] ?? "").trim()).filter(Boolean);
}

export async function getYearlySummary(accessToken: string, year: string): Promise<MonthSummary[]> {
  const months = await listMonths(accessToken);
  const yearMonths = months.filter((m) => m.endsWith(`-${year}`));
  if (yearMonths.length === 0) return [];

  const client = sheetsClient(accessToken);
  const ranges = yearMonths.map((m) => `'${m}'!A1:D${ITEM_LAST_ROW}`);

  const res = await client.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges,
  });

  const valueRanges = res.data.valueRanges ?? [];

  return yearMonths.map((month, i) => {
    const rows = valueRanges[i]?.values ?? [];
    const getCell = (r: number, c: number) => rows[r - 1]?.[c - 1];

    const salary = toNumber(getCell(3, 2));
    const bonus = toNumber(getCell(4, 2));
    const sso = toNumber(getCell(5, 2));
    const other = toNumber(getCell(6, 2));
    const balance = salary - bonus - sso - other;

    const categoryMap = new Map<string, { plan: number; actual: number }>();
    let totalActual = 0;
    let totalPlan = 0;

    for (let r = ITEM_FIRST_ROW; r <= ITEM_LAST_ROW; r++) {
      const category = getCell(r, 1);
      const plan = toNumber(getCell(r, 3));
      const actual = toNumber(getCell(r, 4));
      if (!category) continue;
      const cat = String(category).trim();
      if (!categoryMap.has(cat)) categoryMap.set(cat, { plan: 0, actual: 0 });
      const entry = categoryMap.get(cat)!;
      entry.plan += plan;
      entry.actual += actual;
      totalActual += actual;
      totalPlan += plan;
    }

    const categories = Array.from(categoryMap.entries()).map(([category, v]) => ({
      category,
      planTotal: v.plan,
      actualTotal: v.actual,
    }));

    return { month, salary, bonus, sso, other, balance, totalPlan, totalActual, difference: balance - totalActual, categories };
  });
}

export async function ensureCategoryInSettings(
  accessToken: string,
  category: string
): Promise<void> {
  const trimmed = category.trim();
  if (!trimmed) return;
  const existing = await listCategories(accessToken);
  if (existing.includes(trimmed)) return;

  const client = sheetsClient(accessToken);
  await client.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SETTINGS_SHEET_NAME}'!A2:A50`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[trimmed]] },
  });
}

// ─── Installment functions ───────────────────────────────────────────────────

const INSTALLMENT_SHEET = "_Installments";
// Columns: A=PlanName B=No C=PlannedAmt D=DueDate E=Status F=ActualAmt G=PaidDate

async function ensureInstallmentSheet(client: sheets_v4.Sheets): Promise<void> {
  const meta = await client.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = (meta.data.sheets ?? []).some((s) => s.properties?.title === INSTALLMENT_SHEET);
  if (exists) return;
  await client.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        { addSheet: { properties: { title: INSTALLMENT_SHEET, hidden: true } } },
      ],
    },
  });
  await client.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${INSTALLMENT_SHEET}'!A1:G1`,
    valueInputOption: "RAW",
    requestBody: { values: [["PlanName", "No", "PlannedAmt", "DueDate", "Status", "ActualAmt", "PaidDate"]] },
  });
}

export async function listInstallmentPlans(accessToken: string): Promise<string[]> {
  const client = sheetsClient(accessToken);
  await ensureInstallmentSheet(client);
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${INSTALLMENT_SHEET}'!A2:A1000`,
  });
  const rows = res.data.values ?? [];
  const seen = new Set<string>();
  for (const r of rows) {
    const name = String(r[0] ?? "").trim();
    if (name) seen.add(name);
  }
  return Array.from(seen);
}

export async function getInstallmentPlan(accessToken: string, planName: string): Promise<InstallmentPlan> {
  const client = sheetsClient(accessToken);
  await ensureInstallmentSheet(client);
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${INSTALLMENT_SHEET}'!A2:G1000`,
  });
  const rows = res.data.values ?? [];
  const planRows: InstallmentRow[] = [];
  rows.forEach((r, idx) => {
    if (String(r[0] ?? "").trim() !== planName) return;
    planRows.push({
      rowIndex: idx + 2,
      no: Number(r[1] ?? 0),
      plannedAmount: Number(r[2] ?? 0),
      dueDate: String(r[3] ?? ""),
      paid: String(r[4] ?? "").toLowerCase() === "paid",
      actualAmount: Number(r[5] ?? 0),
      paidDate: String(r[6] ?? ""),
    });
  });
  planRows.sort((a, b) => a.no - b.no);
  return { name: planName, rows: planRows };
}

export async function createInstallmentPlan(
  accessToken: string,
  planName: string,
  monthlyAmount: number,
  count: number,
  startMonth: string // MM/YYYY
): Promise<void> {
  const client = sheetsClient(accessToken);
  await ensureInstallmentSheet(client);

  const [mm, yyyy] = startMonth.split("/").map(Number);
  const rows: string[][] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(yyyy, mm - 1 + i, 1);
    const due = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    rows.push([planName, String(i + 1), String(monthlyAmount), due, "", "", ""]);
  }

  await client.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${INSTALLMENT_SHEET}'!A2:G2`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}

export async function updateInstallmentRow(
  accessToken: string,
  rowIndex: number,
  paid: boolean,
  actualAmount: number,
  paidDate: string
): Promise<void> {
  const client = sheetsClient(accessToken);
  await client.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${INSTALLMENT_SHEET}'!E${rowIndex}:G${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [[paid ? "paid" : "", paid ? String(actualAmount) : "", paidDate]] },
  });
}

export async function deleteInstallmentPlan(accessToken: string, planName: string): Promise<void> {
  const client = sheetsClient(accessToken);
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${INSTALLMENT_SHEET}'!A2:A1000`,
  });
  const rows = res.data.values ?? [];
  const toDelete: number[] = [];
  rows.forEach((r, idx) => {
    if (String(r[0] ?? "").trim() === planName) toDelete.push(idx + 2);
  });
  if (toDelete.length === 0) return;

  // Delete rows in reverse order to maintain indices
  const sheetId = await getSheetIdByName(client, INSTALLMENT_SHEET);
  if (sheetId === null) return;
  const requests = toDelete.reverse().map((r) => ({
    deleteDimension: {
      range: { sheetId, dimension: "ROWS", startIndex: r - 1, endIndex: r },
    },
  }));
  await client.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests },
  });
}
