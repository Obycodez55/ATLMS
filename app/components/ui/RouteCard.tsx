interface RouteCardProps {
  pickup: string;
  destination: string;
  fare?: number;
  fareLabel?: string;
  className?: string;
}

export default function RouteCard({ pickup, destination, fare, fareLabel = "Fixed fare", className = "" }: RouteCardProps) {
  return (
    <div className={`bg-[#F7F9FC] border border-[#E6EBF1] rounded-[14px] p-4 ${className}`}>
      <div className="flex items-center gap-2.5 text-[14px]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#1F4E79] flex-shrink-0" />
        <span className="font-semibold text-[#1B2A3D]">{pickup}</span>
      </div>
      <div className="my-1.5 ml-1 w-px h-4 bg-[#CBD5E1]" />
      <div className="flex items-center gap-2.5 text-[14px]">
        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#00A896] flex-shrink-0" />
        <span className="font-semibold text-[#1B2A3D]">{destination}</span>
      </div>
      {fare !== undefined && (
        <div className="mt-3.5 pt-3.5 border-t border-[#EEF2F7] flex justify-between text-[14px]">
          <span className="text-[#64748B]">{fareLabel}</span>
          <span className="font-bold text-[#1F4E79] tabular-nums">₦{fare.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
