import { getInquiries } from "@/app/actions/admin";
import InquiriesClient from "./InquiriesClient";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries();

  return (
    <InquiriesClient initialInquiries={inquiries} />
  );
}
