"use client";

import { useState } from "react";
import { updateInquiryStatus } from "@/app/actions/admin";
import { useToast } from "@/lib/toast";

interface Inquiry {
  id: number;
  userId: number | null;
  itemName: string;
  category: string;
  sizeEu: string | null;
  budget: number | null;
  notes: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  status: string;
  createdAt: Date;
}

interface InquiriesClientProps {
  initialInquiries: Inquiry[];
}

export default function InquiriesClient({ initialInquiries }: InquiriesClientProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { showToast } = useToast();

  async function handleStatusChange(id: number, newStatus: string) {
    if (updatingId !== null) return;
    setUpdatingId(id);

    try {
      const res = await updateInquiryStatus(id, newStatus);
      if (res.success) {
        setInquiries(prev =>
          prev.map(inq => (inq.id === id ? { ...inq, status: newStatus } : inq))
        );
        showToast("Status updated successfully.", "success");
      } else {
        showToast("Failed to update status.", "error");
      }
    } catch {
      showToast("Error occurred while updating inquiry status.", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  // Statistics
  const totalCount = inquiries.length;
  const newCount = inquiries.filter(i => i.status === "new").length;
  const resolvedCount = inquiries.filter(i => i.status === "resolved").length;

  // Filtered List
  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch =
      inq.itemName.toLowerCase().includes(search.toLowerCase()) ||
      inq.contactName.toLowerCase().includes(search.toLowerCase()) ||
      inq.contactEmail.toLowerCase().includes(search.toLowerCase()) ||
      (inq.contactPhone && inq.contactPhone.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || inq.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-[#c8ff00] text-[#0A0A0A] font-bold";
      case "contacted":
        return "bg-blue-50 border border-blue-200 text-blue-700 font-semibold";
      case "resolved":
        return "bg-green-50 border border-green-200 text-green-700 font-semibold";
      default:
        return "bg-gray-50 border border-gray-200 text-gray-600";
    }
  };

  return (
    <div className="p-8 md:p-12 flex-grow flex flex-col gap-8 bg-[#F9F9F9]">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <h1 className="font-display text-6xl md:text-7xl font-black uppercase tracking-tighter text-[#0A0A0A] leading-[0.85] flex flex-col">
          <span>CUSTOMER</span>
          <span>INQUIRIES</span>
        </h1>

        {/* Search Input */}
        <div className="relative w-64 md:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-[#999999] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search inquiries..."
            className="w-full bg-white border border-[#E5E5E5] pl-10 pr-4 py-3 text-xs focus:border-[#0A0A0A] focus:outline-none transition-colors rounded-none text-[#0A0A0A]"
          />
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Inquiries */}
        <div className="bg-white border border-[#E5E5E5] p-6 rounded-none flex flex-col justify-between h-[120px]">
          <span className="font-label text-[10px] tracking-[0.15em] uppercase text-[#888888] font-bold">
            TOTAL INQUIRIES
          </span>
          <span className="font-display text-4xl font-extrabold text-[#0A0A0A] mt-auto">
            {totalCount}
          </span>
        </div>

        {/* New Inquiries */}
        <div className="bg-white border border-[#E5E5E5] p-6 rounded-none flex flex-col justify-between h-[120px]">
          <span className="font-label text-[10px] tracking-[0.15em] uppercase text-[#888888] font-bold">
            NEW INQUIRIES
          </span>
          <div className="flex items-center gap-3 mt-auto">
            <span className="font-display text-4xl font-extrabold text-[#0A0A0A]">
              {newCount}
            </span>
            {newCount > 0 && (
              <span className="bg-[#c8ff00] text-[#0A0A0A] text-[9px] font-bold tracking-wider uppercase px-2.5 py-1">
                Awaiting Reply
              </span>
            )}
          </div>
        </div>

        {/* Resolved Inquiries */}
        <div className="bg-white border border-[#E5E5E5] p-6 rounded-none flex flex-col justify-between h-[120px]">
          <span className="font-label text-[10px] tracking-[0.15em] uppercase text-[#888888] font-bold">
            RESOLVED INQUIRIES
          </span>
          <span className="font-display text-4xl font-extrabold text-[#0A0A0A] mt-auto">
            {resolvedCount}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#E5E5E5] pb-px">
        {["ALL", "NEW", "CONTACTED", "RESOLVED"].map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2.5 font-label text-[10px] tracking-wider uppercase font-bold border-b-2 transition-all rounded-none ${
              statusFilter === tab
                ? "border-[#0A0A0A] text-[#0A0A0A]"
                : "border-transparent text-[#999999] hover:text-[#0A0A0A]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Inquiries Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-none overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white border-b border-[#E5E5E5] font-label text-[10px] tracking-[0.15em] uppercase text-[#888888] font-bold">
                <th className="px-8 py-5">DATE</th>
                <th className="px-8 py-5">CUSTOMER</th>
                <th className="px-8 py-5">REQUESTED ITEM</th>
                <th className="px-8 py-5">SPECS</th>
                <th className="px-8 py-5">BUDGET</th>
                <th className="px-8 py-5">STATUS</th>
                <th className="px-8 py-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] font-body text-xs text-[#0A0A0A]/80">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center text-[#999999] text-sm">
                    No inquiries found.
                  </td>
                </tr>
              ) : (
                filteredInquiries.map(inq => {
                  const dateStr = new Date(inq.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr key={inq.id} className="hover:bg-[#FAFAFA] transition-colors align-top">
                      {/* Date */}
                      <td className="px-8 py-5 whitespace-nowrap font-mono text-[11px] text-[#888888]">
                        {dateStr}
                      </td>

                      {/* Customer Info */}
                      <td className="px-8 py-5">
                        <span className="font-semibold text-[#0A0A0A] block">
                          {inq.contactName}
                        </span>
                        <a
                          href={`mailto:${inq.contactEmail}`}
                          className="text-gray-500 hover:text-black block mt-0.5"
                        >
                          {inq.contactEmail}
                        </a>
                        {inq.contactPhone && (
                          <span className="text-[#888888] font-mono text-[11px] block mt-0.5">
                            {inq.contactPhone}
                          </span>
                        )}
                      </td>

                      {/* Item Details */}
                      <td className="px-8 py-5">
                        <span className="font-display text-sm font-bold text-[#0A0A0A] uppercase block">
                          {inq.itemName}
                        </span>
                        <span className="font-label text-[9px] tracking-wider text-[#888888] uppercase block mt-0.5">
                          {inq.category}
                        </span>
                        {inq.notes && (
                          <p className="text-gray-500 mt-2 text-[11px] italic bg-[#F5F5F5] p-2.5 border-l-2 border-gray-300 max-w-sm whitespace-pre-line leading-relaxed">
                            &ldquo;{inq.notes}&rdquo;
                          </p>
                        )}
                      </td>

                      {/* Size Specifications */}
                      <td className="px-8 py-5 font-mono text-[13px] font-bold text-[#0A0A0A]">
                        {inq.sizeEu || "N/A"}
                      </td>

                      {/* Budget */}
                      <td className="px-8 py-5 font-mono text-[13px] text-[#0A0A0A]">
                        {inq.budget !== null ? `$${inq.budget.toFixed(2)}` : "N/A"}
                      </td>

                      {/* Status */}
                      <td className="px-8 py-5">
                        <span className={`inline-block text-[9px] uppercase tracking-wider px-2.5 py-1 ${getStatusBadge(inq.status)}`}>
                          {inq.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-5 text-right">
                        <div className="inline-block relative">
                          <select
                            value={inq.status}
                            disabled={updatingId === inq.id}
                            onChange={e => handleStatusChange(inq.id, e.target.value)}
                            className="bg-white border border-[#E5E5E5] focus:border-[#0A0A0A] px-2 py-1.5 text-[10px] font-label font-bold tracking-wider uppercase text-[#0A0A0A] focus:outline-none cursor-pointer rounded-none disabled:opacity-50 appearance-none pr-6"
                          >
                            <option value="new">NEW</option>
                            <option value="contacted">CONTACTED</option>
                            <option value="resolved">RESOLVED</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-1.5 top-2 text-[#999999] pointer-events-none text-[12px] font-bold">
                            unfold_more
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
