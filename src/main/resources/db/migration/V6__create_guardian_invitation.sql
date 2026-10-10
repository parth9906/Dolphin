
CREATE TABLE guardian_invitation (
    id UUID PRIMARY KEY,
    guardian_id UUID NOT NULL,
    invitation_email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_guardian_invitation_guardian
        FOREIGN KEY (guardian_id) REFERENCES guardian(id),

    CONSTRAINT fk_guardian_invitation_creator
        FOREIGN KEY (created_by_user_id) REFERENCES user_account(id),

    CONSTRAINT uk_guardian_invitation_token_hash
        UNIQUE (token_hash)
);

CREATE INDEX idx_guardian_invitation_guardian
    ON guardian_invitation(guardian_id);

CREATE INDEX idx_guardian_invitation_expiry
    ON guardian_invitation(expires_at);