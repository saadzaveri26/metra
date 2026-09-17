import RoleTopNavbar from "@/components/navigation/RoleTopNavbar";
import VendorSidebar from "@/components/vendor/VendorSidebar";

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
    <div className="flex flex-col min-h-screen bg-[#f7faff]">
      <RoleTopNavbar role="vendor" />
      <div className="flex-1 flex min-w-0">
        <VendorSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
