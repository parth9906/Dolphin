import { useEffect } from "react";

import type { AcademicYear, ClassSection, SchoolClass } from "../api/academic-types";

interface UseAcademicSelectionReconciliationOptions {
  years: AcademicYear[];
  yearId: string;
  setYearId: (yearId: string) => void;
  classes: SchoolClass[];
  classId: string;
  setClassId: (classId: string) => void;
  sections: ClassSection[];
  sectionId: string;
  setSectionId: (sectionId: string) => void;
}

/** Keeps the selected academic hierarchy aligned with the currently loaded options. */
export function useAcademicSelectionReconciliation({
  years,
  yearId,
  setYearId,
  classes,
  classId,
  setClassId,
  sections,
  sectionId,
  setSectionId,
}: UseAcademicSelectionReconciliationOptions) {
  useEffect(() => {
    if (years.length > 0 && !years.some((item) => item.id === yearId)) {
      const preferred = years.find((item) => item.status === "ACTIVE") ?? years[0];
      setYearId(preferred.id);
    } else if (years.length === 0 && yearId) {
      setYearId("");
    }
  }, [years, yearId, setYearId]);

  useEffect(() => {
    if (classes.length > 0 && !classes.some((item) => item.id === classId)) {
      setClassId(classes[0].id);
    } else if (classes.length === 0 && classId) {
      setClassId("");
    }
  }, [classes, classId, setClassId]);

  useEffect(() => {
    if (sections.length > 0 && !sections.some((item) => item.id === sectionId)) {
      setSectionId(sections[0].id);
    } else if (sections.length === 0 && sectionId) {
      setSectionId("");
    }
  }, [sections, sectionId, setSectionId]);
}
