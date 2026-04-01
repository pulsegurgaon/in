import { useGetTicker } from "@workspace/api-client-react";

export function Ticker() {
  const { data: ticker } = useGetTicker();

  if (!ticker?.enabled || !ticker.text) return null;

  return (
    <div className="bg-primary text-primary-foreground text-xs font-semibold py-2 overflow-hidden whitespace-nowrap flex">
      <div className="animate-[ticker-scroll_20s_linear_infinite] inline-block px-4">
        {ticker.text}
      </div>
      <div className="animate-[ticker-scroll_20s_linear_infinite] inline-block px-4" aria-hidden="true">
        {ticker.text}
      </div>
    </div>
  );
}
