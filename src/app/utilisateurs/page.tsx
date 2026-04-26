import UsersPanel from "@/components/users/users-panel";
import { getUsers } from "@/services/user.service";
import { requireRole } from "../../lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UtilisateursPage() {
  await requireRole(["admin"]);
  const users = await getUsers();

  return <UsersPanel users={users} />;
}