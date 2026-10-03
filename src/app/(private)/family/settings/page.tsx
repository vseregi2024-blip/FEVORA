import { ImperiaSettings } from "@/components/imperia-settings";
import { requireUser } from "@/server/auth";

import { logoutAction } from "../../actions";

export default async function FamilySettingsPage() {
  const user = await requireUser();
  const loyaltyConnected = Boolean(process.env.BOT_CLIENT_API_URL?.trim() && process.env.BOT_CLIENT_API_SECRET?.trim());
  return <ImperiaSettings user={{ name: user.name, email: user.email, timezone: user.timezone, currency: user.defaultCurrency }} loyaltyConnected={loyaltyConnected} logoutAction={logoutAction}/>;
}
