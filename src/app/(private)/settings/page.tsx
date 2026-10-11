import { redirect } from "next/navigation";

/** Legacy settings compatibility route. */
export default function SettingsPage() { redirect("/family/settings"); }
