-- Marks and assessments are stored per student and institution-wide (an
-- assessment has no section), so the teacher path is enforced in code by
-- resolving each student's active enrollment section on the assessment date
-- (see AssessmentService.resolveSectionRestriction and StudentSectionResolver).
--
-- Institution-level scope holders keep their existing institution-wide access;
-- these grants only add the section-scoped teacher path. Mark audit history
-- (MARKS_AUDIT_READ) stays restricted to administrators.

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'TEACHER'
  AND p.code IN (
      'MARKS_READ',
      'MARKS_RECORD',
      'MARKS_UPDATE'
  )
ON CONFLICT DO NOTHING;
