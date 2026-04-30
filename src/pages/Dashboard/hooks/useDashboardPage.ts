import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@app/store/store";
import { can } from "@app/utils/security";
import { DASHBOARD_BOARDS } from "../domain/boards";

export function useDashboardPage() {
  const permissions = useAppSelector((state) => state.security.permissions);

  const visibleBoards = useMemo(
    () =>
      DASHBOARD_BOARDS.filter(
        (board) => !board.permission || can(permissions, board.permission),
      ),
    [permissions],
  );
  const [activeKey, setActiveKey] = useState(() => visibleBoards[0]?.key ?? "");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  useEffect(() => {
    if (!visibleBoards.some((board) => board.key === activeKey)) {
      setActiveKey(visibleBoards[0]?.key ?? "");
    }
  }, [activeKey, visibleBoards]);

  const ActiveBoard =
    visibleBoards.find((board) => board.key === activeKey)?.component ?? null;

  return {
    visibleBoards,
    activeKey,
    hoveredKey,
    setActiveKey,
    setHoveredKey,
    ActiveBoard,
  };
}
