import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { DashboardBoardSelector } from "./Dashboard/components/DashboardBoardSelector";
import { DashboardEmptyState } from "./Dashboard/components/DashboardEmptyState";
import { useDashboardPage } from "./Dashboard/hooks/useDashboardPage";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const Dashboard = () => {
  const {
    visibleBoards,
    activeKey,
    hoveredKey,
    setActiveKey,
    setHoveredKey,
    ActiveBoard,
  } = useDashboardPage();

  return (
    <section className="content">
      <div className="container-fluid">
        {visibleBoards.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <>
            <DashboardBoardSelector
              boards={visibleBoards}
              activeKey={activeKey}
              hoveredKey={hoveredKey}
              onSelect={setActiveKey}
              onHoverChange={setHoveredKey}
            />

            <div style={{ marginBottom: 20 }} />

            {ActiveBoard && <ActiveBoard />}
          </>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
