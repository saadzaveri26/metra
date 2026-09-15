import VendorSidebar from "@/components/vendor/VendorSidebar";
import VendorHeader from "@/components/vendor/VendorHeader";

export const metadata = {
  title: "Vendor Portal | METRA",
  description: "Pre-Market Legal Metrology Packaging Self-Check & Compliance Portal",
};

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f7faff]">
      <VendorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <VendorHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
