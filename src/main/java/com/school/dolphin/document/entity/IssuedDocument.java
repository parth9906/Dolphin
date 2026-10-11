package com.school.dolphin.document.entity;

import com.school.dolphin.identity.entity.UserAccount;
import com.school.dolphin.organization.entity.Institution;
import com.school.dolphin.student.entity.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "issued_document")
@Getter
@NoArgsConstructor
public class IssuedDocument {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private DocumentTemplate template;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issued_by_user_id", nullable = false)
    private UserAccount issuedBy;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private OffsetDateTime issuedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public IssuedDocument(
            Student student,
            Institution institution,
            DocumentTemplate template,
            String title,
            String content,
            UserAccount issuedBy
    ) {
        this.id = UUID.randomUUID();
        this.student = student;
        this.institution = institution;
        this.template = template;
        this.title = title;
        this.content = content;
        this.issuedBy = issuedBy;
        OffsetDateTime now = OffsetDateTime.now();
        this.issuedAt = now;
        this.createdAt = now;
    }
}
