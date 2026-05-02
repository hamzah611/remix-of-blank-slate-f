import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AnalyticsRow {
  user_id: string;
  display_name: string | null;
  lessons_completed: number;
  total_minutes_spent: number;
  total_xp: number;
  last_active: string | null;
}

function useUserAnalytics() {
  return useQuery<AnalyticsRow[]>({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_user_analytics");
      if (error) throw error;
      return (data ?? []) as AnalyticsRow[];
    },
  });
}

function formatMinutes(mins: number): string {
  if (mins < 1) return "< 1m";
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminAnalytics() {
  const { data: rows = [], isLoading, error } = useUserAnalytics();

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 860 }}>
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 22,
          fontWeight: 700,
          color: "#1E2D3D",
          marginBottom: 4,
        }}
      >
        User Analytics
      </h2>

      {isLoading ? (
        <p style={{ color: "#1E2D3D", opacity: 0.4, fontSize: 14 }}>Loading…</p>
      ) : error ? (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "#FBE9E7", border: "1.5px solid #C17B4A" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#C17B4A" }}>
            Migration required
          </p>
          <p className="text-xs mt-1" style={{ color: "#1E2D3D", opacity: 0.7 }}>
            Run <code>supabase/migrations/20260502_user_analytics.sql</code> in the Supabase SQL
            editor to enable this feature.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <p style={{ color: "#1E2D3D", opacity: 0.35, fontSize: 14 }}>No user data yet.</p>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1.5px solid #E8E0D5" }}
        >
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: "white", borderBottom: "1.5px solid #E8E0D5" }}>
                {["User", "Lessons Completed", "Time Spent", "Total XP", "Last Active"].map((h) => (
                  <TableHead
                    key={h}
                    style={{
                      color: "#1E2D3D",
                      opacity: 0.5,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow
                  key={row.user_id}
                  style={{
                    backgroundColor: i % 2 === 0 ? "white" : "#FDFAF6",
                    borderBottom: "1px solid #F0EAE0",
                  }}
                >
                  <TableCell style={{ color: "#1E2D3D", fontWeight: 500 }}>
                    {row.display_name ?? "—"}
                  </TableCell>
                  <TableCell style={{ color: "#1E2D3D" }}>
                    {row.lessons_completed}
                  </TableCell>
                  <TableCell style={{ color: "#1E2D3D" }}>
                    {formatMinutes(row.total_minutes_spent)}
                  </TableCell>
                  <TableCell style={{ color: "#1E2D3D" }}>
                    {row.total_xp} XP
                  </TableCell>
                  <TableCell style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 12 }}>
                    {formatDate(row.last_active)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
