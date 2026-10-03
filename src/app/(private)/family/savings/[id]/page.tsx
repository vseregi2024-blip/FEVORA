import { redirect } from "next/navigation";

export default function LegacyEnvelopeRedirectPage() {
  redirect("/money?project=FAMILY#envelopes");
}
