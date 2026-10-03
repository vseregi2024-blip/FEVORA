import { redirect } from "next/navigation";

export default function LegacyNewSavingsPage() {
  redirect("/money/new?project=FAMILY&kind=ENVELOPE");
}
