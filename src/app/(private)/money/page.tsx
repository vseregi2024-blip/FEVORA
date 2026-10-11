import { redirect } from "next/navigation";

/** The former mixed project-money dashboard is retired from user navigation.
 * Wallets and current allocation live in Safe; capital has its own overview. */
export default function MoneyPage() { redirect("/safe"); }
