/** Khung xương mô phỏng bố cục WordCard trong lúc tải trang. */
const Bar = ({ className }: { className: string }) => <div className={`rounded bg-[#e9ecef] ${className}`} />;

export default function WordCardSkeleton() {
  return (
    <div
      aria-hidden
      className="my-4 animate-pulse rounded-lg border border-[#e5e5e5] bg-white p-3.5 shadow-[0_5px_15px_rgba(0,0,0,0.04)] sm:p-[25px]"
    >
      <Bar className="h-6 w-20" />
      <Bar className="mt-4 h-14 w-48 sm:h-16" />
      <Bar className="mt-4 h-6 w-40" />
      <Bar className="mt-3 h-5 w-56" />

      <div className="mt-5 rounded-md border-l-4 border-[#d5ece6] bg-[#f3faf8] p-3">
        <Bar className="h-4 w-40" />
        <Bar className="mt-2 h-4 w-3/4" />
      </div>

      <div className="mt-4 flex gap-4">
        <div className="h-[70px] w-[70px] rounded-md border border-dashed border-[#dfe3e6]" />
        <div className="h-[70px] w-[70px] rounded-md border border-dashed border-[#dfe3e6]" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md border border-[#f6dcdc] p-2.5">
            <Bar className="h-5 w-16" />
            <Bar className="mt-2 h-3.5 w-20" />
            <Bar className="mt-1.5 h-3.5 w-24" />
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-md bg-[#f5f9ff] p-3">
        <Bar className="h-4 w-28" />
        <Bar className="mt-3 h-5 w-2/3" />
        <Bar className="mt-2 h-4 w-1/2" />
      </div>
    </div>
  );
}
