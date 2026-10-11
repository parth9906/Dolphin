
INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (gen_random_uuid(), 'DOCUMENT_TEMPLATE_CREATE',
     'Create Document Template', 'Create document templates',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'DOCUMENT_TEMPLATE_READ',
     'Read Document Template', 'List and read document templates',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'DOCUMENT_ISSUE',
     'Issue Document', 'Issue a certificate or document for a student',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'DOCUMENT_READ',
     'Read Document', 'Read issued document metadata and content',
     TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'DOCUMENT_TEMPLATE_CREATE',
      'DOCUMENT_TEMPLATE_READ',
      'DOCUMENT_ISSUE',
      'DOCUMENT_READ'
  )
ON CONFLICT DO NOTHING;
