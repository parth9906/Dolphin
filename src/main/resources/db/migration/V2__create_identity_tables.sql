CREATE TABLE user_account (
    id UUID PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);


CREATE TABLE role (
    id UUID PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);


CREATE TABLE permission (
    id UUID PRIMARY KEY,
    code VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);


CREATE TABLE user_role (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_role_user
        FOREIGN KEY (user_id)
        REFERENCES user_account(id),

    CONSTRAINT fk_user_role_role
        FOREIGN KEY (role_id)
        REFERENCES role(id)
);


CREATE INDEX idx_user_role_role_id
    ON user_role(role_id);


CREATE TABLE role_permission (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permission_role
        FOREIGN KEY (role_id)
        REFERENCES role(id),

    CONSTRAINT fk_role_permission_permission
        FOREIGN KEY (permission_id)
        REFERENCES permission(id)
);


CREATE INDEX idx_role_permission_permission_id
    ON role_permission(permission_id);

CREATE TABLE user_organization_scope (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL,

    scope_type VARCHAR(30) NOT NULL,
    scope_id UUID NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_user_org_scope_user
        FOREIGN KEY (user_id)
        REFERENCES user_account(id),

    CONSTRAINT uk_user_org_scope
        UNIQUE (user_id, scope_type, scope_id)
);


CREATE INDEX idx_user_org_scope_user_id
    ON user_organization_scope(user_id);


CREATE INDEX idx_user_org_scope_scope
    ON user_organization_scope(scope_type, scope_id);



--insert data into table
BEGIN;

INSERT INTO role (
    id, code, name, description, active, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'PLATFORM_ADMIN',
    'Platform Administrator',
    'Development bootstrap administrator',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (gen_random_uuid(), 'ROLE_CREATE', 'Create Role', NULL, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'ROLE_READ', 'Read Role', NULL, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'PERMISSION_CREATE', 'Create Permission', NULL, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'PERMISSION_READ', 'Read Permission', NULL, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'USER_CREATE', 'Create User', NULL, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'USER_ROLE_ASSIGN', 'Assign User Role', NULL, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'ROLE_PERMISSION_ASSIGN', 'Assign Role Permission', NULL, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'USER_SCOPE_ASSIGN', 'Assign Organization Scope', NULL, TRUE, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'ROLE_CREATE',
      'ROLE_READ',
      'PERMISSION_CREATE',
      'PERMISSION_READ',
      'USER_CREATE',
      'USER_ROLE_ASSIGN',
      'ROLE_PERMISSION_ASSIGN',
      'USER_SCOPE_ASSIGN'
  )
ON CONFLICT DO NOTHING;

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM user_account u
CROSS JOIN role r
WHERE u.username = 'dolphin_admin'
  AND r.code = 'PLATFORM_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;



INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
    (
        gen_random_uuid(), 'STUDENT_CREATE',
        'Create Student', 'Create student records',
        TRUE, NOW(), NOW()
    ),
    (
        gen_random_uuid(), 'STUDENT_READ',
        'Read Student', 'Read student records',
        TRUE, NOW(), NOW()
    )
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN ('STUDENT_CREATE', 'STUDENT_READ')
ON CONFLICT DO NOTHING;



INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
(
    gen_random_uuid(),
    'STUDENT_UPDATE',
    'Update Student',
    'Update a student profile within the authorized organization scope',
    TRUE, NOW(), NOW()
),
(
    gen_random_uuid(),
    'STUDENT_DEACTIVATE',
    'Deactivate Student',
    'Deactivate a student within the authorized organization scope',
    TRUE, NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN ('STUDENT_UPDATE', 'STUDENT_DEACTIVATE')
ON CONFLICT DO NOTHING;


INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
(
    gen_random_uuid(), 'GUARDIAN_CREATE', 'Create Guardian',
    'Create guardian records', TRUE, NOW(), NOW()
),
(
    gen_random_uuid(), 'GUARDIAN_READ', 'Read Guardian',
    'Read guardian records and student guardian relationships',
    TRUE, NOW(), NOW()
),
(
    gen_random_uuid(), 'STUDENT_GUARDIAN_LINK', 'Link Guardian to Student',
    'Create student guardian relationships',
    TRUE, NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'GUARDIAN_CREATE',
      'GUARDIAN_READ',
      'STUDENT_GUARDIAN_LINK'
  )
ON CONFLICT DO NOTHING;


INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES
(
    gen_random_uuid(), 'GUARDIAN_UPDATE', 'Update Guardian',
    'Update guardian contact details', TRUE, NOW(), NOW()
),
(
    gen_random_uuid(), 'GUARDIAN_DEACTIVATE', 'Deactivate Guardian',
    'Deactivate a guardian and their active student relationships',
    TRUE, NOW(), NOW()
),
(
    gen_random_uuid(), 'STUDENT_GUARDIAN_UNLINK', 'Unlink Guardian',
    'Deactivate a student-guardian relationship', TRUE, NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'GUARDIAN_UPDATE',
      'GUARDIAN_DEACTIVATE',
      'STUDENT_GUARDIAN_UNLINK'
  )
ON CONFLICT DO NOTHING;



INSERT INTO role (
    id, code, name, description, active, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'GUARDIAN',
    'Guardian',
    'Parent or guardian portal access',
    TRUE, NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'GUARDIAN_INVITE',
    'Invite Guardian',
    'Invite a guardian to create a portal account',
    TRUE, NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code = 'GUARDIAN_INVITE'
ON CONFLICT DO NOTHING;



INSERT INTO permission (
    id, code, name, description, active, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'PARENT_PORTAL_READ',
    'Read Parent Portal',
    'Read basic profiles of students linked to the authenticated guardian',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'GUARDIAN'
  AND p.code = 'PARENT_PORTAL_READ'
ON CONFLICT DO NOTHING;