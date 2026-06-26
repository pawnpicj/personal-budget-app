import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import InstallmentClient from "./InstallmentClient";

export default async function InstallmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <InstallmentClient />;
}
