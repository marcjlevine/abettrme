import { useState, useRef } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";
import { getProgressSummary, getProgressLogs, getProgressRedemptions } from "../lib/api";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default function Progress() {
  const [startDate, setStartDate] = useState(thirtyDaysAgo());
  const [endDate, setEndDate] = useState(today());

  const { data: summary } = useQuery({ queryKey: ["progress-summary"], queryFn: getProgressSummary });
  const { data: logs = [] } = useQuery({
    queryKey: ["progress-logs", startDate, endDate],
    queryFn: () => getProgressLogs({ start_date: startDate, end_date: endDate }),
  });
  const { data: redemptions = [] } = useQuery({
    queryKey: ["progress-redemptions", startDate, endDate],
    queryFn: () => getProgressRedemptions({ start_date: startDate, end_date: endDate }),
  });

  // Merge logs and redemptions into a single timeline, sorted by date desc
  const timeline = [
    ...logs.map((l) => ({ ...l, _type: "log" })),
    ...redemptions.map((r) => ({ ...r, _type: "redemption", date: r.redeemed_at.slice(0, 10) })),
  ].sort((a, b) => {
    const da = a.date || a.redeemed_at?.slice(0, 10) || "";
    const db = b.date || b.redeemed_at?.slice(0, 10) || "";
    return db.localeCompare(da);
  });

  const listRef = useRef(null);
  const virtualizer = useWindowVirtualizer({
    count: timeline.length,
    estimateSize: () => 62,
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Progress</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 text-center">
          <p className="text-sm text-gray-500 mb-1">Current Points</p>
          <p className={`text-4xl font-bold tabular-nums ${(summary?.current_points ?? 0) >= 0 ? "text-brand-600" : "text-red-500"}`}>
            {summary?.current_points ?? "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">available to spend</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 text-center">
          <p className="text-sm text-gray-500 mb-1">All-Time Points</p>
          <p className={`text-4xl font-bold tabular-nums ${(summary?.all_time_points ?? 0) >= 0 ? "text-gray-800" : "text-red-500"}`}>
            {summary?.all_time_points ?? "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">net lifetime total</p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">From</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <label className="text-sm font-medium text-gray-700">To</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Timeline */}
      {timeline.length === 0 && (
        <p className="text-gray-400 text-center py-12">No entries in this date range.</p>
      )}

      <div ref={listRef}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = timeline[virtualItem.index];
            return (
              <div
                key={item._type === "log" ? `log-${item.id}` : `rdm-${item.id}`}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                {item._type === "log" ? (
                  <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-4 mb-2">
                    <span className={`text-base font-bold w-16 text-right tabular-nums shrink-0 ${item.points_snapshot >= 0 ? "text-brand-600" : "text-red-500"}`}>
                      {item.points_snapshot > 0 ? "+" : ""}{item.points_snapshot}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.activity?.name ?? `Activity #${item.activity_id}`}</p>
                      {item.notes && <p className="text-sm text-gray-500">{item.notes}</p>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{item.date}</span>
                  </div>
                ) : (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 px-4 py-3 flex items-center gap-4 mb-2">
                    <span className="text-base font-bold w-16 text-right tabular-nums shrink-0 text-amber-600">
                      -{item.points_snapshot}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        Redeemed: {item.reward?.name ?? `Reward #${item.reward_id}`}
                      </p>
                      {item.notes && <p className="text-sm text-gray-500">{item.notes}</p>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{item.date}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
