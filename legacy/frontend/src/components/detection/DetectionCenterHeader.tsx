
import TenantHeader from "@/components/layout/TenantHeader";

interface DetectionCenterHeaderProps {
  title: string;
}

const DetectionCenterHeader = ({ title }: DetectionCenterHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <TenantHeader />
    </div>
  );
};

export default DetectionCenterHeader;
