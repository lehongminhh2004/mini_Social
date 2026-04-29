package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*") // Mở cửa cho mọi Frontend gọi vào
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // API Đăng ký: POST http://localhost:8080/api/users/register
    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        try {
            User savedUser = userService.registerUser(user);
            return ResponseEntity.ok(savedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null); // Trả về lỗi 400 nếu trùng email/username
        }
    }

    // API Lấy danh sách: GET http://localhost:8080/api/users
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    @PostMapping("/login")
public ResponseEntity<String> login(@RequestBody User loginRequest) {
    try {
        String token = userService.login(loginRequest.getUsername(), loginRequest.getPasswordHash());
        return ResponseEntity.ok(token);
    } catch (RuntimeException e) {
        return ResponseEntity.status(401).body(e.getMessage());
    }
}
@PutMapping("/profile")
public ResponseEntity<User> updateProfile(
        Principal principal,
        @RequestBody User profileData) { // Dùng chính Model User để hứng Bio và AvatarUrl
    return ResponseEntity.ok(userService.updateProfile(
            principal.getName(), 
            profileData.getFullName(), 
            profileData.getBio(), 
            profileData.getAvatarUrl()
    ));
}
@GetMapping("/search")
public ResponseEntity<List<User>> searchUsers(@RequestParam String keyword) {
    return ResponseEntity.ok(userService.searchUsers(keyword));
}
}