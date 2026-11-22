import { redirect } from "next/navigation";

export default function LegacyActivityRedirect() {
  redirect("/github/activity");
}
