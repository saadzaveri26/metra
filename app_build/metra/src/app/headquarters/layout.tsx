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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <HQSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
