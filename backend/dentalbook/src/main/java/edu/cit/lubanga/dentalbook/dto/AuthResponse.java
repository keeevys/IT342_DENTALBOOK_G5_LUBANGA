package edu.cit.lubanga.dentalbook.dto;

public class AuthResponse {
    
    private Integer userId;
    private String fullName;
    private String email;
    private String message;
    
    public AuthResponse() {
    }
    
    public AuthResponse(Integer userId, String fullName, String email, String message) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.message = message;
    }
    
    public Integer getUserId() {
        return userId;
    }
    
    public void setUserId(Integer userId) {
        this.userId = userId;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
}
