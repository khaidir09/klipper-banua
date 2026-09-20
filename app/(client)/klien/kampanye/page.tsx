import { redirect } from "next/navigation";

/**
 * The campaign list lives on the portal's landing page, which the menu points
 * at. This stays as a safety net for links that still carry the old path.
 */
export default function ClientCampaignsPage() {
  redirect("/klien");
}
