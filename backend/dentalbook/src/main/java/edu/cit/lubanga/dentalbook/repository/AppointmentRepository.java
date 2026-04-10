package edu.cit.lubanga.dentalbook.repository;

import edu.cit.lubanga.dentalbook.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByUserIdOrderByAppointmentDateAscAppointmentTimeAsc(Integer userId);
}
