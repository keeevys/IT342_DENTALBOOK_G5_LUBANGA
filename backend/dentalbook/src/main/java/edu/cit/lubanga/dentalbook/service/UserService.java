package edu.cit.lubanga.dentalbook.service;

import edu.cit.lubanga.dentalbook.dto.LoginRequest;
import edu.cit.lubanga.dentalbook.dto.RegisterRequest;
import edu.cit.lubanga.dentalbook.dto.AuthResponse;
import edu.cit.lubanga.dentalbook.entity.User;
import edu.cit.lubanga.dentalbook.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Register a new user
     * - Validates that email doesn't exist
     * - Hashes the password
     * - Saves user to database
     */
    public AuthResponse registerUser(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        
        // Create new user with hashed password
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        // Save user to database
        User savedUser = userRepository.save(user);
        
        // Return response
        return new AuthResponse(
            savedUser.getUserId(),
            savedUser.getFullName(),
            savedUser.getEmail(),
            "User registered successfully"
        );
    }
    
    /**
     * Login user
     * - Validates email exists
     * - Verifies password
     * - Returns user information
     */
    public AuthResponse loginUser(LoginRequest request) {
        // Find user by email
        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());
        
        if (optionalUser.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }
        
        User user = optionalUser.get();
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        
        // Return response
        return new AuthResponse(
            user.getUserId(),
            user.getFullName(),
            user.getEmail(),
            "Login successful"
        );
    }
}
