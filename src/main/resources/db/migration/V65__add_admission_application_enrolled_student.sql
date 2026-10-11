ALTER TABLE admission_application
    ADD COLUMN enrolled_student_id UUID REFERENCES student(id);
