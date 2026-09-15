import ConsumerSidebar from "@/components/consumer/ConsumerSidebar";
import ConsumerHeader from "@/components/consumer/ConsumerHeader";

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
    <div className="flex min-h-screen bg-[#f7faff]">
      <ConsumerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ConsumerHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
