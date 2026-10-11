package com.school.dolphin.timetable.repository;


import com.school.dolphin.timetable.entity.SchoolRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SchoolRoomRepository
        extends JpaRepository<SchoolRoom, UUID> {

    boolean existsByInstitution_IdAndCodeIgnoreCase(
            UUID institutionId, String code);

    List<SchoolRoom> findByInstitution_IdAndActiveTrueOrderByNameAsc(
            UUID institutionId);
}
