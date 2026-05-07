package edu.cit.lubanga.dentalbook.service;

import edu.cit.lubanga.dentalbook.dto.AppointmentRequest;
import edu.cit.lubanga.dentalbook.dto.AppointmentResponse;
import edu.cit.lubanga.dentalbook.entity.Appointment;
import edu.cit.lubanga.dentalbook.repository.AppointmentRepository;
import edu.cit.lubanga.dentalbook.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    public AppointmentResponse bookAppointment(AppointmentRequest request) {
        if (!userRepository.existsById(request.getUserId())) {
            throw new RuntimeException("User does not exist");
        }

        Appointment appointment = new Appointment();
        appointment.setUserId(request.getUserId());
        appointment.setService(request.getService().trim());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setNotes(request.getNotes());
        appointment.setStatus("BOOKED");

        Appointment savedAppointment = appointmentRepository.save(appointment);
        return toResponse(savedAppointment, "Appointment booked (draft)");
    }

    public List<AppointmentResponse> getAppointmentsByUser(Integer userId) {
        return appointmentRepository.findByUserIdOrderByAppointmentDateAscAppointmentTimeAsc(userId)
                .stream()
                .map(appointment -> toResponse(appointment, "Appointment retrieved"))
                .toList();
    }

    public AppointmentResponse cancelAppointment(Long appointmentId, Integer userId) {
        Optional<Appointment> optionalAppointment = appointmentRepository.findById(appointmentId);

        if (optionalAppointment.isEmpty()) {
            throw new RuntimeException("Appointment not found");
        }

        Appointment appointment = optionalAppointment.get();

        if (!appointment.getUserId().equals(userId)) {
            throw new RuntimeException("Appointment does not belong to user");
        }

        appointment.setStatus("CANCELLED");
        Appointment savedAppointment = appointmentRepository.save(appointment);
        return toResponse(savedAppointment, "Appointment cancelled");
    }

    public AppointmentResponse updateAppointmentStatus(Long appointmentId, String status) {
        Optional<Appointment> optionalAppointment = appointmentRepository.findById(appointmentId);

        if (optionalAppointment.isEmpty()) {
            throw new RuntimeException("Appointment not found");
        }

        Appointment appointment = optionalAppointment.get();
        String previousStatus = appointment.getStatus();
        appointment.setStatus(status);

        // If transitioning to APPROVED or REJECTED, mark notification pending if not already sent
        if (("APPROVED".equalsIgnoreCase(status) || "REJECTED".equalsIgnoreCase(status)) && !appointment.isNotificationPending()) {
            // mark as pending so client can notify the patient once
            appointment.setNotificationPending(true);
        }

        Appointment saved = appointmentRepository.save(appointment);
        String msg = "Appointment status updated";
        if (!previousStatus.equalsIgnoreCase(status)) {
            msg = "Appointment " + status.toLowerCase();
        }
        return toResponse(saved, msg);
    }

    public AppointmentResponse markNotificationDelivered(Long appointmentId, Integer userId) {
        Optional<Appointment> optionalAppointment = appointmentRepository.findById(appointmentId);

        if (optionalAppointment.isEmpty()) {
            throw new RuntimeException("Appointment not found");
        }

        Appointment appointment = optionalAppointment.get();

        if (!appointment.getUserId().equals(userId)) {
            throw new RuntimeException("Appointment does not belong to user");
        }

        appointment.setNotificationPending(false);
        Appointment saved = appointmentRepository.save(appointment);
        return toResponse(saved, "Notification marked delivered");
    }

    private AppointmentResponse toResponse(Appointment appointment, String message) {
        AppointmentResponse response = new AppointmentResponse();
        response.setAppointmentId(appointment.getAppointmentId());
        response.setUserId(appointment.getUserId());
        response.setService(appointment.getService());
        response.setAppointmentDate(appointment.getAppointmentDate());
        response.setAppointmentTime(appointment.getAppointmentTime());
        response.setNotes(appointment.getNotes());
        response.setStatus(appointment.getStatus());
        response.setNotificationPending(appointment.isNotificationPending());
        response.setCreatedAt(appointment.getCreatedAt());
        response.setMessage(message);
        return response;
    }
}
