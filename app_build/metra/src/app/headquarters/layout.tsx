import RoleTopNavbar from "@/components/navigation/RoleTopNavbar";
import HQSidebar from "@/components/headquarters/HQSidebar";

export const metadata = {
  title: "Headquarters Directorate | METRA",
  description: "National Legal Metrology Policy, Rule Matrix & Officer Directorate",
};

export default function HeadquartersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <RoleTopNavbar role="headquarters" />
      <div className="flex-1 flex min-w-0">
        <HQSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
