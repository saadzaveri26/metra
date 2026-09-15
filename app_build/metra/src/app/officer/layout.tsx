import OfficerSidebar from "@/components/officer/OfficerSidebar";
import OfficerHeader from "@/components/officer/OfficerHeader";

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
    <div className="flex min-h-screen bg-[#f7faff]">
      <OfficerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <OfficerHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
