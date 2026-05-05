import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface UserRow {
  user_id: string;
  display_name: string;
  email: string;
  plan: "free" | "premium";
  created_at: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PlanBadge({ plan }: { plan: "free" | "premium" }) {
  const isPremium = plan === "premium";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        backgroundColor: isPremium ? "#FFF8E1" : "rgba(30,45,61,0.06)",
        color: isPremium ? "#C17B4A" : "rgba(30,45,61,0.5)",
        borderRadius: 99,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {isPremium ? "⭐ Premium" : "Free"}
    </span>
  );
}

export function AdminApprovals() {
  const qc = useQueryClient();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin", "approvals"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_users_for_admin" as never);
      if (error) throw error;
      return data as UserRow[];
    },
  });

  const setPlanMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: "free" | "premium" }) => {
      const { error } = await supabase.rpc("set_user_plan" as never, {
        target_user_id: userId,
        new_plan: plan,
      } as never);
      if (error) throw error;
    },
    onSuccess: (_, { plan }) => {
      qc.invalidateQueries({ queryKey: ["admin", "approvals"] });
      toast.success(plan === "premium" ? "Upgraded to Premium ⭐" : "Downgraded to Free");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to update plan");
    },
    onSettled: () => setLoadingUserId(null),
  });

  const handleTogglePlan = (user: UserRow) => {
    const newPlan = user.plan === "free" ? "premium" : "free";
    setLoadingUserId(user.user_id);
    setPlanMutation.mutate({ userId: user.user_id, plan: newPlan });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#6BA3C8", marginBottom: 6 }}
        >
          Approvals
        </p>
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#1E2D3D",
            letterSpacing: "-0.01em",
            marginBottom: 4,
          }}
        >
          User Plans
        </h2>
        <p style={{ fontSize: 13, color: "rgba(30,45,61,0.45)", fontFamily: "'Inter', system-ui, sans-serif" }}>
          Free users can only access the first unit. Upgrade them to Premium to unlock everything.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            backgroundColor: "#FFF3CD",
            border: "1px solid #FFD96A",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#856404",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          ⚠️ Could not load users. Make sure you've run the <strong>20260505_user_plans.sql</strong> migration in your Supabase SQL editor.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <div
            className="animate-spin"
            style={{
              width: 32,
              height: 32,
              border: "3px solid rgba(30,45,61,0.08)",
              borderTop: "3px solid #D4A853",
              borderRadius: "50%",
            }}
          />
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 14,
            border: "1.5px solid #E8E0D5",
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: "rgba(30,45,61,0.02)" }}>
                <TableHead style={{ color: "#1E2D3D", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em" }}>
                  User
                </TableHead>
                <TableHead style={{ color: "#1E2D3D", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em" }}>
                  Email
                </TableHead>
                <TableHead style={{ color: "#1E2D3D", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em" }}>
                  Plan
                </TableHead>
                <TableHead style={{ color: "#1E2D3D", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em" }}>
                  Joined
                </TableHead>
                <TableHead style={{ color: "#1E2D3D", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em" }}>
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      color: "rgba(30,45,61,0.35)",
                      fontSize: 13,
                      padding: "32px 0",
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => {
                const isThisLoading = loadingUserId === user.user_id;
                return (
                  <TableRow
                    key={user.user_id}
                    style={{ borderBottom: "1px solid rgba(30,45,61,0.06)" }}
                  >
                    <TableCell
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "#1E2D3D",
                        fontFamily: "'Inter', system-ui, sans-serif",
                      }}
                    >
                      {user.display_name || "—"}
                    </TableCell>
                    <TableCell
                      style={{
                        fontSize: 13,
                        color: "rgba(30,45,61,0.6)",
                        fontFamily: "'Inter', system-ui, sans-serif",
                      }}
                    >
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={user.plan} />
                    </TableCell>
                    <TableCell
                      style={{
                        fontSize: 13,
                        color: "rgba(30,45,61,0.5)",
                        fontFamily: "'Inter', system-ui, sans-serif",
                      }}
                    >
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleTogglePlan(user)}
                        disabled={isThisLoading}
                        style={{
                          backgroundColor: user.plan === "free" ? "#D4A853" : "rgba(30,45,61,0.06)",
                          color: user.plan === "free" ? "#FFFFFF" : "rgba(30,45,61,0.6)",
                          border: "none",
                          borderRadius: 8,
                          padding: "6px 14px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: isThisLoading ? "not-allowed" : "pointer",
                          fontFamily: "'Inter', system-ui, sans-serif",
                          letterSpacing: "0.02em",
                          opacity: isThisLoading ? 0.6 : 1,
                          transition: "opacity 150ms ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isThisLoading
                          ? "Saving…"
                          : user.plan === "free"
                          ? "↑ Upgrade"
                          : "↓ Downgrade"}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
