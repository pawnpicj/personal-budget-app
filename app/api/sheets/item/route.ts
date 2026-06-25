import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenOrThrow, handleApiError } from "@/lib/server-auth";
import { addItem, updateItem, deleteItem } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const body = await req.json();
    const { month, category, item, plan, actual } = body;
    if (!month || !category || !item) {
      return NextResponse.json(
        { error: "month, category, item are required" },
        { status: 400 }
      );
    }
    const rowIndex = await addItem(accessToken, month, {
      category: String(category).trim(),
      item: String(item).trim(),
      plan: Number(plan) || 0,
      actual: Number(actual) || 0,
    });
    return NextResponse.json({ ok: true, rowIndex });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const body = await req.json();
    const { month, rowIndex, category, item, plan, actual } = body;
    if (!month || !rowIndex || !category || !item) {
      return NextResponse.json(
        { error: "month, rowIndex, category, item are required" },
        { status: 400 }
      );
    }
    await updateItem(accessToken, month, Number(rowIndex), {
      category: String(category).trim(),
      item: String(item).trim(),
      plan: Number(plan) || 0,
      actual: Number(actual) || 0,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const accessToken = await getAccessTokenOrThrow();
    const body = await req.json();
    const { month, rowIndex } = body;
    if (!month || !rowIndex) {
      return NextResponse.json({ error: "month, rowIndex are required" }, { status: 400 });
    }
    await deleteItem(accessToken, month, Number(rowIndex));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
