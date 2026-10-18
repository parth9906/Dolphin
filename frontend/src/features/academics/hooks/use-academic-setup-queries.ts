import { useQuery } from "@tanstack/react-query";

import { organizationService } from "../../organization/api/organization-service";
import type { Campus, Institution } from "../../organization/api/organization-types";
import { academicService } from "../api/academic-service";
import type {
  AcademicYear,
  ClassSection,
  SchoolClass,
  StudentEnrollment,
  StudentForEnrollment,
} from "../api/academic-types";
import type { Option } from "../components/academic-ui";

interface UseAcademicSetupQueriesOptions {
  clusterId: string;
  institutionId: string;
  yearId: string;
  classId: string;
  sectionId: string;
  studentSearch: string;
  canReadInstitution: boolean;
  canReadYears: boolean;
  canReadClasses: boolean;
  canReadSections: boolean;
  canReadEnrollments: boolean;
  canEnrollStudents: boolean;
}

export function useAcademicSetupQueries({
  clusterId,
  institutionId,
  yearId,
  classId,
  sectionId,
  studentSearch,
  canReadInstitution,
  canReadYears,
  canReadClasses,
  canReadSections,
  canReadEnrollments,
  canEnrollStudents,
}: UseAcademicSetupQueriesOptions) {
  const institutionListQuery = useQuery({
    queryKey: ["organization", "institutions", clusterId],
    queryFn: () => organizationService.getInstitutions(clusterId),
    enabled: Boolean(clusterId && canReadInstitution),
    staleTime: 60_000,
  });

  const singleInstitutionQuery = useQuery({
    queryKey: ["organization", "institution", institutionId],
    queryFn: () => organizationService.getInstitution(institutionId),
    enabled: Boolean(institutionId && !clusterId),
    staleTime: 60_000,
  });

  const institutionOptions: Institution[] =
    institutionListQuery.data ??
    (singleInstitutionQuery.data ? [singleInstitutionQuery.data] : []);

  const institutionSelectOptions: Option[] = [
    ...institutionOptions.map((item) => ({ value: item.id, label: item.name })),
    ...(institutionId && !institutionOptions.some((item) => item.id === institutionId)
      ? [{
          value: institutionId,
          label: singleInstitutionQuery.data?.name ?? "Selected institution",
        }]
      : []),
  ];

  const yearsQuery = useQuery({
    queryKey: ["academics", "years", institutionId],
    queryFn: () => academicService.getAcademicYears(institutionId),
    enabled: Boolean(institutionId && canReadYears),
    staleTime: 30_000,
  });

  const years: AcademicYear[] = yearsQuery.data ?? [];
  const yearOptions: Option[] = years.map((year) => ({
    value: year.id,
    label: `${year.name} · ${year.status}`,
  }));

  const classesQuery = useQuery({
    queryKey: ["academics", "classes", yearId],
    queryFn: () => academicService.getClasses(yearId),
    enabled: Boolean(yearId && canReadClasses),
    staleTime: 30_000,
  });

  const classes: SchoolClass[] = classesQuery.data ?? [];
  const classOptions: Option[] = classes.map((item) => ({
    value: item.id,
    label: `${item.name}${item.code ? ` · ${item.code}` : ""}`,
  }));

  const sectionsQuery = useQuery({
    queryKey: ["academics", "sections", classId],
    queryFn: () => academicService.getSections(classId),
    enabled: Boolean(classId && canReadSections),
    staleTime: 30_000,
  });

  const sections: ClassSection[] = sectionsQuery.data ?? [];
  const sectionOptions: Option[] = sections.map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.activeEnrollmentCount} students`,
  }));

  const campusesQuery = useQuery({
    queryKey: ["organization", "campuses", institutionId],
    queryFn: () => organizationService.getCampuses(institutionId),
    enabled: Boolean(institutionId && canReadInstitution),
    staleTime: 60_000,
  });
  const campuses: Campus[] = campusesQuery.data ?? [];
  const campusOptions: Option[] = campuses.map((campus) => ({
    value: campus.id,
    label: campus.name,
  }));

  const enrollmentsQuery = useQuery({
    queryKey: ["academics", "section-enrollments", sectionId],
    queryFn: () => academicService.getSectionEnrollments(sectionId),
    enabled: Boolean(sectionId && canReadEnrollments),
    staleTime: 15_000,
  });
  const enrollments: StudentEnrollment[] = enrollmentsQuery.data?.content ?? [];

  const studentsQuery = useQuery({
    queryKey: ["academics", "student-search", institutionId, studentSearch],
    queryFn: () => academicService.searchStudents(institutionId, studentSearch),
    enabled: Boolean(
      institutionId && sectionId && canEnrollStudents && studentSearch.trim().length >= 2,
    ),
    staleTime: 10_000,
  });

  const students: StudentForEnrollment[] = (studentsQuery.data?.content ?? [])
    .filter((student) => student.active);

  const studentOptions: Option[] = students.map((student) => ({
    value: student.id,
    label: `${student.firstName} ${student.lastName ?? ""}`.trim()
      + (student.admissionNumber ? ` · ${student.admissionNumber}` : ""),
  }));

  return {
    institutionListQuery,
    singleInstitutionQuery,
    institutionOptions,
    institutionSelectOptions,
    yearsQuery,
    years,
    yearOptions,
    classesQuery,
    classes,
    classOptions,
    sectionsQuery,
    sections,
    sectionOptions,
    campusesQuery,
    campusOptions,
    enrollmentsQuery,
    enrollments,
    studentsQuery,
    studentOptions,
  };
}
