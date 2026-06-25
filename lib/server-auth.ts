import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getAccessTokenOrThrow(): Promise<string> {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken;
  if (!session || !accessToken) {
    throw new UnauthorizedError();
  }
  return accessToken as string;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export function handleApiError(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json({ error: message }, { status: 500 });
}
