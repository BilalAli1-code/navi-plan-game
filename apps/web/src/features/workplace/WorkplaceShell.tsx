import { useEffect, useId, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useParams,
} from "react-router-dom";
import {
  workplaceActivitiesPath,
  workplaceCompletedHistoryPath,
  workplaceDecisionLogPath,
  workplaceDocumentsPath,
  workplaceInboxPath,
  workplaceMeetingsPath,
  workplaceMissionControlPath,
  workplaceNotificationsPath,
  workplacePerformancePath,
  workplaceProgressPath,
  workplaceAchievementsPath,
  workplaceMasteryPath,
  workplaceCoachingPath,
  workplaceStakeholdersPath,
} from "./routes";
import "./WorkplaceShell.css";

const NARROW_QUERY = "(max-width: 899px)";

/**
 * Run-scoped Unified Workplace Shell (PS-ROADMAP-013).
 *
 * UI-only composition: navigation + outlet. Does not fetch or own projection
 * payloads. Child routes retain TanStack Query ownership.
 */
export function WorkplaceShell() {
  const { simulationRunId = "" } = useParams();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const navListId = useId();

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setIsNarrow(false);
      return;
    }
    const media = window.matchMedia(NARROW_QUERY);
    const sync = () => {
      setIsNarrow(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (!simulationRunId.trim()) {
    return (
      <div className="workplace-shell">
        <p role="alert">A simulation run id is required.</p>
        <p>
          <Link to="/">Home</Link>
        </p>
      </div>
    );
  }

  const navHidden = isNarrow && !menuOpen;

  return (
    <div className="workplace-shell" data-testid="workplace-shell">
      <aside className="workplace-sidebar">
        <div className="workplace-context">
          <div>
            <p className="workplace-identity">ProjectSim</p>
            <p className="workplace-run" data-testid="workplace-run-id">
              Run {simulationRunId}
            </p>
          </div>
          <Link className="workplace-home" to="/">
            Home
          </Link>
        </div>

        <div className="workplace-nav-bar">

        <button
          type="button"
          ref={menuToggleRef}
          className="workplace-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls={navListId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          Workplace menu
        </button>
        <nav aria-label="Workplace">
          <ul
            id={navListId}
            className="workplace-nav-list"
            data-testid="workplace-nav"
            hidden={navHidden}
          >
            <li>
              <NavLink to={workplaceMissionControlPath(simulationRunId)} end>
                Mission Control
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceInboxPath(simulationRunId)} end>
                Inbox
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceMeetingsPath(simulationRunId)} end>
                Meetings
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceStakeholdersPath(simulationRunId)} end>
                Stakeholders
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceDocumentsPath(simulationRunId)} end>
                Documents
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceNotificationsPath(simulationRunId)} end>
                Notifications
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceActivitiesPath(simulationRunId)} end>
                Activities
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceCompletedHistoryPath(simulationRunId)} end>
                Completed History
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceDecisionLogPath(simulationRunId)} end>
                Decision Log
              </NavLink>
            </li>
            <li>
              <NavLink to={workplacePerformancePath(simulationRunId)} end>
                Performance
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceProgressPath(simulationRunId)} end>
                Progress
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceAchievementsPath(simulationRunId)} end>
                Achievements
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceMasteryPath(simulationRunId)} end>
                Mastery
              </NavLink>
            </li>
            <li>
              <NavLink to={workplaceCoachingPath(simulationRunId)} end>
                Coaching
              </NavLink>
            </li>
          </ul>
        </nav>
        </div>
      </aside>


      <div
        className="workplace-content"
        ref={contentRef}
        tabIndex={-1}
        data-testid="workplace-content"
      >
        <Outlet />
      </div>
    </div>
  );
}
