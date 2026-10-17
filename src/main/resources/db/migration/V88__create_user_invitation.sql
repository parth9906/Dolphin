
CREATE TABLE user_invitation (
                                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                 invitation_email VARCHAR(255) NOT NULL,
                                 username VARCHAR(100) NOT NULL,
                                 first_name VARCHAR(100) NOT NULL,
                                 last_name VARCHAR(100),

                                 token_hash VARCHAR(64) NOT NULL,

                                 role_id UUID NOT NULL,
                                 scope_type VARCHAR(30) NOT NULL,
                                 scope_id UUID NOT NULL,

                                 expires_at TIMESTAMPTZ NOT NULL,
                                 accepted_at TIMESTAMPTZ,
                                 revoked_at TIMESTAMPTZ,

                                 created_by_user_id UUID NOT NULL,
                                 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                 CONSTRAINT uq_user_invitation_token_hash
                                     UNIQUE (token_hash),

                                 CONSTRAINT fk_user_invitation_role
                                     FOREIGN KEY (role_id) REFERENCES role(id),

                                 CONSTRAINT fk_user_invitation_creator
                                     FOREIGN KEY (created_by_user_id) REFERENCES user_account(id),

                                 CONSTRAINT chk_user_invitation_acceptance
                                     CHECK (accepted_at IS NULL OR accepted_at <= expires_at)
);

CREATE INDEX idx_user_invitation_email
    ON user_invitation (LOWER(invitation_email));

CREATE INDEX idx_user_invitation_expiry
    ON user_invitation (expires_at);

CREATE INDEX idx_user_invitation_creator
    ON user_invitation (created_by_user_id);
