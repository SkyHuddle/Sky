import { redirect } from "next/navigation";
import { pageContext } from "@/server/page";

export const dynamic = "force-dynamic";

export default async function MyProfile() {
  const { viewer } = await pageContext();
  redirect(viewer ? `/u/${viewer.username}` : "/signin?next=/profile");
}
