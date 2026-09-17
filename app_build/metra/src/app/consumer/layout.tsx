import RoleTopNavbar from "@/components/navigation/RoleTopNavbar";
import ConsumerSidebar from "@/components/consumer/ConsumerSidebar";

export const metadata = {
  title: "Citizen Portal | METRA",
  description: "Consumer Packaged Goods Verification, Nutrition Insights & Citizen Reporting",
};

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f7faff]">
      <RoleTopNavbar role="consumer" />
      <div className="flex-1 flex min-w-0">
        <ConsumerSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
