
import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "./AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { PermissionRoute } from "./PermissionRoute";
import { AnyPermissionRoute } from "./AnyPermissionRoute";

import { LoginPage } from "../features/auth/pages/LoginPage";
import { TeacherManagementPage } from "../features/staff/pages/TeacherManagementPage";
import { UserManagementPage } from "../features/users/pages/UserManagementPage";
import { AcceptInvitationPage } from "../features/users/pages/AcceptInvitationPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { AcademicSetupPage } from "../features/academics/pages/AcademicSetupPage";
import { OrganizationPage } from "../features/organization/pages/OrganizationPage";
import { InstitutionDetailPage } from "../features/organization/pages/InstitutionDetailPage";
import { ClusterDetailPage } from "../features/organization/pages/ClusterDetailPage";

import { AttendancePage } from "../features/attendance/pages/AttendancePage";
import { AttendanceAnalyticsPage } from "../features/attendance/pages/AttendanceAnalyticsPage";
import { AssessmentManagementPage } from "../features/examinations/pages/AssessmentManagementPage";
import { TimetablePage } from "../features/timetable/pages/TimetablePage";
import { StudentListPage } from "../features/students/pages/StudentListPage";
import { AdmissionsPage } from "../features/admissions/pages/AdmissionsPage";
import { HomeworkPage } from "../features/homework/pages/HomeworkPage";
import { CertificatesPage } from "../features/certificates/pages/CertificatesPage";
import { LeaveManagementPage } from "../features/leave/pages/LeaveManagementPage";
import { DisciplinePage } from "../features/discipline/pages/DisciplinePage";
import { InventoryPage } from "../features/inventory/pages/InventoryPage";
import { HostelPage } from "../features/hostel/pages/HostelPage";
import { ParentPortalPage } from "../features/parent-portal/pages/ParentPortalPage";

import { CreateStudentPage } from "../features/students/pages/CreateStudentPage";
import { StudentDetailPage } from "../features/students/pages/StudentDetailPage";
import { EditStudentPage } from "../features/students/pages/EditStudentPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/accept-invitation",
    element: <AcceptInvitationPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "organization",
        element: (
          <PermissionRoute permission="ENTERPRISE_READ">
            <OrganizationPage />
          </PermissionRoute>
        ),
      },
      {
        path: "organization/institutions/:id",
        element: (
          <PermissionRoute permission="INSTITUTION_READ">
            <InstitutionDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "organization/clusters/:id",
        element: (
          <PermissionRoute permission="CLUSTER_READ">
            <ClusterDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "students/new",
        element: (
          <PermissionRoute permission="STUDENT_CREATE">
            <CreateStudentPage />
          </PermissionRoute>
        ),
      },
      {
        path: "students/:id/edit",
        element: (
          <PermissionRoute permission="STUDENT_READ">
            <PermissionRoute permission="STUDENT_UPDATE">
              <EditStudentPage />
            </PermissionRoute>
          </PermissionRoute>
        ),
      },
      {
        path: "students/:id",
        element: (
          <PermissionRoute permission="STUDENT_READ">
            <StudentDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "academics",
        element: (
          <AnyPermissionRoute
            permissions={[
              "ACADEMIC_YEAR_READ", "ACADEMIC_YEAR_CREATE",
              "CLASS_READ", "CLASS_CREATE",
              "SECTION_READ", "SECTION_CREATE",
              "ENROLLMENT_READ", "STUDENT_ENROLL"
            ]}
          >
            <AcademicSetupPage />
          </AnyPermissionRoute>
        ),
      },
      {
        path: "staff-management",
        element: (
          <AnyPermissionRoute
            permissions={[
              "STAFF_READ",
              "STAFF_CREATE",
              "STAFF_UPDATE",
            ]}
          >
            <TeacherManagementPage />
          </AnyPermissionRoute>
        ),
      },
      {
        path: "timetable",
        element: (
          <AnyPermissionRoute
            permissions={[
              "ACADEMIC_YEAR_READ", "CLASS_READ", "SECTION_READ",
              "SUBJECT_READ", "SUBJECT_CREATE",
              "TEACHER_SUBJECT_READ", "TEACHER_SUBJECT_ASSIGN", "STAFF_READ",
              "ROOM_READ", "ROOM_CREATE", "TIMETABLE_SLOT_READ",
              "TIMETABLE_SLOT_CREATE", "TIMETABLE_READ",
              "TIMETABLE_LESSON_CREATE", "TIMETABLE_LESSON_CANCEL"
            ]}
          >
            <TimetablePage />
          </AnyPermissionRoute>
        ),
      },
      {
        path: "assessments",
        element: (
          <AnyPermissionRoute
            permissions={[
              "ASSESSMENT_CREATE",
              "MARKS_READ",
              "MARKS_RECORD",
              "MARKS_UPDATE",
              "MARKS_AUDIT_READ",
            ]}
          >
            <AssessmentManagementPage />
          </AnyPermissionRoute>
        ),
      },
      {
        path: "attendance-analytics",
        element: (
          <PermissionRoute permission="ATTENDANCE_LESSON_READ">
            <AttendanceAnalyticsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "attendance",
        element: (
          <AnyPermissionRoute
            permissions={[
              "ATTENDANCE_READ",
              "ATTENDANCE_LESSON_READ",
            ]}
          >
            <AttendancePage />
          </AnyPermissionRoute>
        ),
      },
        {
          path: "discipline",
          element: (
            <AnyPermissionRoute
              permissions={[
                "DISCIPLINE_INCIDENT_READ",
                "DISCIPLINE_INCIDENT_CREATE",
                "DISCIPLINE_INCIDENT_UPDATE",
              ]}
            >
              <DisciplinePage />
            </AnyPermissionRoute>
          ),
        },
        {
          path: "hostel",
          element: (
            <AnyPermissionRoute
              permissions={[
                "HOSTEL_READ",
                "HOSTEL_CREATE",
                "HOSTEL_UPDATE",
                "HOSTEL_ROOM_READ",
                "HOSTEL_ROOM_CREATE",
                "HOSTEL_ROOM_UPDATE",
                "HOSTEL_ALLOCATION_READ",
                "HOSTEL_ALLOCATION_CREATE",
                "HOSTEL_ALLOCATION_UPDATE",
              ]}
            >
              <HostelPage />
            </AnyPermissionRoute>
          ),
        },
        {
          path: "inventory",
          element: (
            <AnyPermissionRoute
              permissions={[
                "INVENTORY_ITEM_READ",
                "INVENTORY_ITEM_CREATE",
                "INVENTORY_ITEM_UPDATE",
                "INVENTORY_STOCK_READ",
                "INVENTORY_STOCK_RECEIVE",
                "INVENTORY_STOCK_ISSUE",
                "INVENTORY_STOCK_ADJUST",
              ]}
            >
              <InventoryPage />
            </AnyPermissionRoute>
          ),
        },
        {
          path: "leave-management",
          element: (
            <AnyPermissionRoute
              permissions={[
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
              ]}
            >
              <LeaveManagementPage />
            </AnyPermissionRoute>
          ),
        },
      {
        path: "certificates",
        element: (
          <AnyPermissionRoute
            permissions={[
              "DOCUMENT_TEMPLATE_CREATE",
              "DOCUMENT_TEMPLATE_READ",
              "DOCUMENT_ISSUE",
              "DOCUMENT_READ",
              "STUDENT_PORTAL_READ",
            ]}
          >
            <CertificatesPage />
          </AnyPermissionRoute>
        ),
      },
      {
        path: "homework",
        element: (
          <AnyPermissionRoute
            permissions={[
              "ASSIGNMENT_READ",
              "ASSIGNMENT_CREATE",
              "ASSIGNMENT_UPDATE",
              "ASSIGNMENT_PUBLISH",
              "ASSIGNMENT_SUBMISSION_READ",
              "ASSIGNMENT_SUBMISSION_GRADE",
              "STUDENT_PORTAL_READ",
              "ASSIGNMENT_SUBMISSION_CREATE",
            ]}
          >
            <HomeworkPage />
          </AnyPermissionRoute>
        ),
      },
      {
        path: "parent-portal",
        element: (
          <PermissionRoute permission="PARENT_PORTAL_READ">
            <ParentPortalPage />
          </PermissionRoute>
        ),
      },
      {
        path: "admissions",
        element: (
          <AnyPermissionRoute
            permissions={[
              "ADMISSION_APPLICATION_READ",
              "ADMISSION_APPLICATION_CREATE",
              "ADMISSION_APPLICATION_UPDATE",
              "ADMISSION_APPLICATION_ENROLL",
            ]}
          >
            <AdmissionsPage />
          </AnyPermissionRoute>
        ),
      },
      {
        path: "user-management",
        element: (
          <AnyPermissionRoute
            permissions={[
              "USER_READ",
              "USER_UPDATE",
              "USER_ROLE_ASSIGN",
              "USER_ROLE_REVOKE",
              "USER_SCOPE_ASSIGN",
              "USER_SCOPE_REVOKE",
              "USER_INVITATION_CREATE",
            ]}
          >
            <UserManagementPage />
          </AnyPermissionRoute>
        ),
      },
      {
        path: "students",
        element: (
          <PermissionRoute permission="STUDENT_READ">
            <StudentListPage />
          </PermissionRoute>
        ),
      },
    ],
  },
]);
