-- Backfill the STUDENT role and institution scope for user accounts that were
-- linked to a student profile before the STUDENT role was introduced (V51).
-- Linking is a one-time relationship (student_account_link has unique
-- constraints on both student_id and user_account_id), so every existing link
-- should carry the STUDENT role and its institution scope.
--
-- Idempotent: conflicts are ignored, so this migration is safe to run against
-- an empty database or a database where some links were already processed.

INSERT INTO user_role (user_id, role_id)
SELECT sal.user_account_id, r.id
FROM student_account_link sal
CROSS JOIN role r
WHERE r.code = 'STUDENT'
  AND r.active = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO user_organization_scope (
    id,
    user_id,
    scope_type,
    scope_id,
    created_at
)
SELECT
    gen_random_uuid(),
    sal.user_account_id,
    'INSTITUTION',
    s.institution_id,
    CURRENT_TIMESTAMP
FROM student_account_link sal
JOIN student s ON s.id = sal.student_id
ON CONFLICT (user_id, scope_type, scope_id) DO NOTHING;
