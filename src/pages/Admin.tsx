import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "./admin/AdminSidebar";
import { QuestionEditor } from "./admin/QuestionEditor";
import { AdminUsers } from "./admin/AdminUsers";
import { AdminAnalytics } from "./admin/AdminAnalytics";
import { AdminApprovals } from "./admin/AdminApprovals";
import type { StageType, AdminRole } from "./admin/adminTypes";
import { STAGE_LABELS, getAdminRole } from "./admin/adminTypes";

export default function Admin() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole>("content_admin");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedStageType, setSelectedStageType] = useState<StageType | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<"stage" | "adminUsers" | "analytics" | "approvals">("stage");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      const role = getAdminRole(session.user as any);
      if (!role) { navigate("/course-map"); return; }
      setAdminRole(role);
      setCurrentUserId(session.user.id);
      setAuthorized(true);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSelectStage = (id: string, type: StageType, unitId?: string) => {
    setSelectedStageId(id);
    setSelectedStageType(type);
    if (unitId) setSelectedUnitId(unitId);
    setSelectedView("stage");
  };

  const handleSelectView = (view: "stage" | "adminUsers" | "analytics" | "approvals") => {
    setSelectedView(view);
    if (view === "adminUsers" || view === "analytics" || view === "approvals") {
      setSelectedStageId(null);
      setSelectedStageType(null);
    }
  };

  if (!authorized) return null;

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "#FAF6F0" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ backgroundColor: "#FAF6F0", borderBottom: "1.5px solid #E8E0D5", zIndex: 40 }}
      >
        <div className="flex items-baseline gap-2">
          <span style={{ color: "#D4A853", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700 }}>
            گفتگو
          </span>
          <span className="font-bold text-base" style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Guftugu Admin
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full ml-2"
            style={{
              backgroundColor: adminRole === "super_admin" ? "#FFF8E1" : "#E8F0F8",
              color: adminRole === "super_admin" ? "#C17B4A" : "#1E2D3D",
            }}
          >
            {adminRole === "super_admin" ? "Super Admin" : "Content Admin"}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          style={{ border: "1.5px solid #E8E0D5", color: "#1E2D3D", backgroundColor: "white", cursor: "pointer" }}
        >
          Log out
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          selectedStageId={selectedStageId}
          onSelectStage={handleSelectStage}
          adminRole={adminRole}
          selectedView={selectedView as any}
          onSelectView={handleSelectView as any}
        />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: "#FAF6F0" }}>
          {selectedView === "approvals" ? (
            <AdminApprovals />
          ) : selectedView === "analytics" ? (
            <AdminAnalytics />
          ) : selectedView === "adminUsers" ? (
            <AdminUsers currentUserId={currentUserId} currentRole={adminRole} />
          ) : selectedStageId && selectedStageType ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#6BA3C8" }}>
                {STAGE_LABELS[selectedStageType]}
              </p>
              <QuestionEditor
                stageId={selectedStageId}
                stageType={selectedStageType}
                unitId={selectedUnitId ?? ""}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: "#1E2D3D", opacity: 0.3, fontSize: 14 }}>
                Select a stage from the sidebar to edit its questions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
