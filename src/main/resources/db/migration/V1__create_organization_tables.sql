CREATE TABLE enterprise (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE region (
    id UUID PRIMARY KEY,
    enterprise_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_region_enterprise
        FOREIGN KEY (enterprise_id)
        REFERENCES enterprise(id),

    CONSTRAINT uk_region_enterprise_code
        UNIQUE (enterprise_id, code)
);

CREATE INDEX idx_region_enterprise_id
    ON region(enterprise_id);


CREATE TABLE cluster (
    id UUID PRIMARY KEY,
    region_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_cluster_region
        FOREIGN KEY (region_id)
        REFERENCES region(id),

    CONSTRAINT uk_cluster_region_code
        UNIQUE (region_id, code)
);

CREATE INDEX idx_cluster_region_id
    ON cluster(region_id);


CREATE TABLE institution (
    id UUID PRIMARY KEY,
    cluster_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    institution_type VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_institution_cluster
        FOREIGN KEY (cluster_id)
        REFERENCES cluster(id),

    CONSTRAINT uk_institution_cluster_code
        UNIQUE (cluster_id, code)
);

CREATE INDEX idx_institution_cluster_id
    ON institution(cluster_id);


CREATE TABLE campus (
    id UUID PRIMARY KEY,
    institution_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_campus_institution
        FOREIGN KEY (institution_id)
        REFERENCES institution(id),

    CONSTRAINT uk_campus_institution_code
        UNIQUE (institution_id, code)
);

CREATE INDEX idx_campus_institution_id
    ON campus(institution_id);