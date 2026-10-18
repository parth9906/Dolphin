import { useState } from "react";
import {
  ClipboardList,
  BarChart3,
  BookOpen,
  Files,
  Building2,
  CalendarRange,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  Waves,
  X,
  CalendarDays,
  Package,
  BedDouble,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth/use-auth";
import { NetworkStatusIndicator } from "./NetworkStatusIndicator";

export function AppShell() {
  const { user, accessContext, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  function closeMenus() {
    setMobileNavOpen(false);
    setAccountMenuOpen(false);
  }

  const displayName = user?.username ?? "User";
  const isHostelPage = location.pathname.startsWith("/hostel");
  const isInventoryPage = location.pathname.startsWith("/inventory");
  const isDisciplinePage = location.pathname.startsWith("/discipline");
  const isLeaveManagementPage = location.pathname.startsWith("/leave-management");
  const isCertificatesPage = location.pathname.startsWith("/certificates");
  const isHomeworkPage = location.pathname.startsWith("/homework");
  const isParentPortalPage = location.pathname.startsWith("/parent-portal");
  const isAdmissionsPage = location.pathname.startsWith("/admissions");
  const isOrganizationPage = location.pathname.startsWith("/organization");
  const isStudentPage = location.pathname.startsWith("/students");
  const isAcademicPage = location.pathname.startsWith("/academics");
  const isAttendanceAnalyticsPage = location.pathname.startsWith("/attendance-analytics");
  const isAttendancePage = location.pathname === "/attendance";
  const isTimetablePage = location.pathname.startsWith("/timetable");
  const isUserManagementPage = location.pathname.startsWith("/user-management");
  const isStaffManagementPage = location.pathname.startsWith("/staff-management");
  const isAssessmentPage = location.pathname.startsWith("/assessments");
  const pageTitle = isAssessmentPage
    ? "Examinations & Marks"
    : isStaffManagementPage
    ? "Teacher Management"
    : isUserManagementPage
    ? "User Management"
    : isHostelPage

    ? "Hostel Management"
    : isInventoryPage
    ? "Inventory Management"
    : isDisciplinePage
    ? "Discipline & Behavior"
    : isLeaveManagementPage
    ? "Leave Management"
    : isCertificatesPage
    ? "Certificates & Documents"
    : isHomeworkPage
    ? "Homework & Assignments"
    : isParentPortalPage
    ? "Parent Portal"
    : isAdmissionsPage
    ? "Admissions"
    : isOrganizationPage
    ? "Organization"
    : isStudentPage
      ? "Students"
      : isAcademicPage
        ? "Academic Setup"
        : isAttendanceAnalyticsPage
          ? "Attendance Analytics"
          : isAttendancePage
            ? "Attendance"
          : isTimetablePage
            ? "Timetable Management"
            : "Overview";


  return (
    <div className="app-shell">
      {mobileNavOpen && (
        <button
          className="app-shell__backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        id="primary-navigation"
        className={`app-sidebar${mobileNavOpen ? " app-sidebar--open" : ""}`}
      >
        <div className="app-sidebar__brand">
          <div className="app-brand__mark" aria-hidden="true">
            <Waves size={23} />
          </div>

          <div className="app-brand__text">
            <span className="app-brand__name">Dolphin</span>
            <span className="app-brand__subtitle">School Management</span>
          </div>

          <button
            className="app-icon-button app-sidebar__close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="app-sidebar__body">
          <p className="app-sidebar__section-label">WORKSPACE</p>

          <nav aria-label="Primary navigation">
            <NavLink
              to="/"
              end
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <LayoutDashboard size={19} />
              <span>Overview</span>
            </NavLink>

            {hasPermission("ENTERPRISE_READ") && (
              <NavLink
                to="/organization"
                onClick={closeMenus}
                className={({ isActive }) =>
                  `app-nav-link${
                    isActive ? " app-nav-link--active" : ""
                  }`
                }
              >
                <Building2 size={19} />
                <span>Organization</span>
              </NavLink>
            )}

            {[
              "USER_READ",
              "USER_UPDATE",
              "USER_ROLE_ASSIGN",
              "USER_ROLE_REVOKE",
              "USER_SCOPE_ASSIGN",
              "USER_SCOPE_REVOKE",
              "USER_INVITATION_CREATE",
            ].some((permission) => hasPermission(permission)) && (
              <NavLink
                to="/user-management"
                onClick={closeMenus}
                className={({ isActive }) =>
                  `app-nav-link${isActive ? " app-nav-link--active" : ""}`
                }
              >
                <Users size={19} />
                <span>User Management</span>
              </NavLink>
            )}
            {[
              "STAFF_READ",
              "STAFF_CREATE",
              "STAFF_UPDATE",
            ].some((permission) => hasPermission(permission)) && (
              <NavLink
                to="/staff-management"
                onClick={closeMenus}
                className={({ isActive }) =>
                  `app-nav-link${isActive ? " app-nav-link--active" : ""}`
                }
              >
                <GraduationCap size={19} />
                <span>Teacher Management</span>
              </NavLink>
            )}
          </nav>

          {[
            "ACADEMIC_YEAR_READ", "ACADEMIC_YEAR_CREATE",
            "CLASS_READ", "CLASS_CREATE",
            "SECTION_READ", "SECTION_CREATE",
            "ENROLLMENT_READ", "STUDENT_ENROLL"
          ].some((permission) => hasPermission(permission)) && (
            <NavLink
              to="/academics"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <CalendarRange size={19} />
              <span>Academic Setup</span>
            </NavLink>
          )}

          {hasPermission("PARENT_PORTAL_READ") && (
            <NavLink
              to="/parent-portal"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <UserRound size={19} />
              <span>Parent Portal</span>
            </NavLink>
          )}

          {[
            "DOCUMENT_TEMPLATE_CREATE",
            "DOCUMENT_TEMPLATE_READ",
            "DOCUMENT_ISSUE",
            "DOCUMENT_READ",
            "STUDENT_PORTAL_READ",
          ].some((permission) => hasPermission(permission)) && (
            <NavLink
              to="/certificates"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <Files size={19} />
              <span>Certificates & Documents</span>
            </NavLink>
          )}

          {[
            "DISCIPLINE_INCIDENT_READ",
            "DISCIPLINE_INCIDENT_CREATE",
            "DISCIPLINE_INCIDENT_UPDATE",
          ].some((permission) => hasPermission(permission)) && (
            <NavLink
              to="/discipline"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <ShieldCheck size={19} />
              <span>Discipline &amp; Behavior</span>
            </NavLink>
          )}

          {[
            "HOSTEL_READ",
            "HOSTEL_CREATE",
            "HOSTEL_UPDATE",
            "HOSTEL_ROOM_READ",
            "HOSTEL_ROOM_CREATE",
            "HOSTEL_ROOM_UPDATE",
            "HOSTEL_ALLOCATION_READ",
            "HOSTEL_ALLOCATION_CREATE",
            "HOSTEL_ALLOCATION_UPDATE",
          ].some((permission) => hasPermission(permission)) && (
            <NavLink
              to="/hostel"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <BedDouble size={19} />
              <span>Hostel Management</span>
            </NavLink>
          )}

          {[
            "INVENTORY_ITEM_READ",
            "INVENTORY_ITEM_CREATE",
            "INVENTORY_ITEM_UPDATE",
            "INVENTORY_STOCK_READ",
            "INVENTORY_STOCK_RECEIVE",
            "INVENTORY_STOCK_ISSUE",
            "INVENTORY_STOCK_ADJUST",
          ].some((permission) => hasPermission(permission)) && (
            <NavLink
              to="/inventory"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <Package size={19} />
              <span>Inventory Management</span>
            </NavLink>
          )}

          {[
            "STAFF_LEAVE_READ",
            "STAFF_LEAVE_CREATE",
            "STAFF_LEAVE_REVIEW",
            "STAFF_LEAVE_CANCEL",
            "STAFF_LEAVE_AUDIT_READ",
            "STUDENT_LEAVE_READ",
            "STUDENT_LEAVE_CREATE",
            "STUDENT_LEAVE_REVIEW",
            "STUDENT_LEAVE_CANCEL",
            "STUDENT_LEAVE_AUDIT_READ",
          ].some((permission) => hasPermission(permission)) && (
            <NavLink
              to="/leave-management"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <CalendarDays size={19} />
              <span>Leave Management</span>
            </NavLink>
          )}

          {[
            "ASSESSMENT_CREATE",
            "MARKS_READ",
            "MARKS_RECORD",
            "MARKS_UPDATE",
            "MARKS_AUDIT_READ",
          ].some((permission) => hasPermission(permission)) && (
            <NavLink
              to="/assessments"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <ClipboardCheck size={19} />
              <span>Examinations &amp; Marks</span>
            </NavLink>
          )}

          {[
            "ASSIGNMENT_READ",
            "ASSIGNMENT_CREATE",
            "ASSIGNMENT_UPDATE",
            "ASSIGNMENT_PUBLISH",
            "ASSIGNMENT_SUBMISSION_READ",
            "ASSIGNMENT_SUBMISSION_GRADE",
            "STUDENT_PORTAL_READ",
            "ASSIGNMENT_SUBMISSION_CREATE",
          ].some((permission) => hasPermission(permission)) && (
            <NavLink
              to="/homework"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <BookOpen size={19} />
              <span>Homework & Assignments</span>
            </NavLink>
          )}

          {[
            "ADMISSION_APPLICATION_READ",
            "ADMISSION_APPLICATION_CREATE",
            "ADMISSION_APPLICATION_UPDATE",
            "ADMISSION_APPLICATION_ENROLL",
          ].some((permission) => hasPermission(permission)) && (
            <NavLink
              to="/admissions"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <ClipboardList size={19} />
              <span>Admissions</span>
            </NavLink>
          )}

          {hasPermission("STUDENT_READ") && (
            <NavLink
              to="/students"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <GraduationCap size={19} />
              <span>Students</span>
            </NavLink>
          )}

          {[
            "ACADEMIC_YEAR_READ", "CLASS_READ", "SECTION_READ",
            "SUBJECT_READ", "SUBJECT_CREATE",
            "TEACHER_SUBJECT_READ", "TEACHER_SUBJECT_ASSIGN", "STAFF_READ",
            "ROOM_READ", "ROOM_CREATE", "TIMETABLE_SLOT_READ",
            "TIMETABLE_SLOT_CREATE", "TIMETABLE_READ",
            "TIMETABLE_LESSON_CREATE", "TIMETABLE_LESSON_CANCEL"
          ].some((permission) => hasPermission(permission)) && (
            <NavLink
              to="/timetable"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <CalendarClock size={19} />
              <span>Timetable</span>
            </NavLink>
          )}

          {(hasPermission("ATTENDANCE_READ") || hasPermission("ATTENDANCE_LESSON_READ")) && (
              <NavLink
                to="/attendance"
                onClick={closeMenus}
                className={({ isActive }) =>
                  `app-nav-link${isActive ? " app-nav-link--active" : ""}`
                }
              >
                <ClipboardCheck size={19} />
                <span>Attendance</span>
              </NavLink>
            )}

          {hasPermission("ATTENDANCE_LESSON_READ") && (
            <NavLink
              to="/attendance-analytics"
              onClick={closeMenus}
              className={({ isActive }) =>
                `app-nav-link${isActive ? " app-nav-link--active" : ""}`
              }
            >
              <BarChart3 size={19} />
              <span>Attendance Analytics</span>
            </NavLink>
          )}


          <div className="app-sidebar__notice">
            <ShieldCheck size={17} />
            <p>
              Your workspace access is determined by your assigned
              permissions.
            </p>
          </div>
        </div>

        <div className="app-sidebar__footer">
          <div className="app-sidebar__user-avatar" aria-hidden="true">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="app-sidebar__user-info">
            <span className="app-sidebar__username">{displayName}</span>
            <span className="app-sidebar__user-caption">Signed in</span>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div className="app-header__left">
            <button
              className="app-icon-button app-header__menu"
              type="button"
              aria-label="Open navigation"
              aria-controls="primary-navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={21} />
            </button>

            <div className="app-header__heading">
              <span className="app-header__eyebrow">DOLPHIN WORKSPACE</span>
              <span className="app-header__title">{pageTitle}</span>
            </div>
          </div>

          <div className="app-header__right">
            <div className="app-account">
              <button
                className="app-account__trigger"
                type="button"
                aria-label="Open account menu"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                <span className="app-account__avatar" aria-hidden="true">
                  {displayName.charAt(0).toUpperCase()}
                </span>

                <span className="app-account__identity">
                  <span className="app-account__name">{displayName}</span>
                  <span className="app-account__caption">
                    {accessContext?.roles.length
                      ? accessContext.roles.join(", ")
                      : "Account"}
                  </span>
                </span>

                <UserRound size={17} />
              </button>

              {accountMenuOpen && (
                <>
                  <button
                    className="app-account__dismiss"
                    type="button"
                    aria-label="Close account menu"
                    onClick={() => setAccountMenuOpen(false)}
                  />

                  <div className="app-account__menu">
                    <div className="app-account__menu-user">
                      <span className="app-account__menu-name">
                        {displayName}
                      </span>
                      <span className="app-account__menu-caption">
                        {user?.userId}
                      </span>
                    </div>

                    <div className="app-account__menu-divider" />

                    <button
                      className="app-account__logout"
                      type="button"
                      disabled={loggingOut}
                      onClick={() => void handleLogout()}
                    >
                      <LogOut size={17} />
                      <span>
                        {loggingOut ? "Signing out..." : "Sign out"}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="app-content">
          <NetworkStatusIndicator />
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>Dolphin School Management</span>
          <span>Secure workspace</span>
        </footer>
      </div>
    </div>
  );
}