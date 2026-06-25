import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import OverviewClient from "./OverviewClient";

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <OverviewClient />;
}
