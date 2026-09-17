import RoleTopNavbar from "@/components/navigation/RoleTopNavbar";
import OfficerSidebar from "@/components/officer/OfficerSidebar";

export const metadata = {
  title: "Officer Portal | METRA",
  description: "Legal Metrology Enforcement & Verification Platform",
};

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f7faff]">
      <RoleTopNavbar role="officer" />
      <div className="flex-1 flex min-w-0">
        <OfficerSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
