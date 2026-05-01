package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.service.UserService;
import com.hientranc2.socialapi.repository.UserRepository; // Thêm dòng này
import lombok.Builder; // Thêm dòng này
import lombok.Data; // Thêm dòng này
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
    private final UserRepository userRepository; // THÊM DÒNG NÀY để móc Data

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

    // =================================================================================
    // PHẦN CODE THÊM MỚI ĐỂ LÀM TRANG CÁ NHÂN (PROFILE) CHO NGƯỜI KHÁC
    // =================================================================================

    // 1. DTO để gói dữ liệu trả về cho an toàn (không gửi kèm password_hash)
    @Data
    @Builder
    public static class UserProfileDTO {
        private String username;
        private String fullName;
        private String avatarUrl;
        private String bio;
        private String email;
    }

    // 2. API lấy thông tin Profile của 1 người cụ thể: GET /api/users/{username}
    @GetMapping("/{username}")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable String username) {
        // Tìm user dưới Database
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng này"));

        // Nặn thành cục DTO an toàn rồi gửi về FE
        UserProfileDTO response = UserProfileDTO.builder()
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .email(user.getEmail())
                .build();

        return ResponseEntity.ok(response);
    }
}