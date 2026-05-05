package com.hientranc2.socialapi.controller;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.service.UserService;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*") 
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        try {
            User savedUser = userService.registerUser(user);
            return ResponseEntity.ok(savedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null); 
        }
    }

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
    public ResponseEntity<User> updateProfile(Principal principal, @RequestBody User profileData) { 
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

    @Data
    @Builder
    public static class UserProfileDTO {
        private UUID id;
        private String username;
        private String fullName;
        private String avatarUrl;
        private String bio;
        private String email;
        private int followerCount;   
        @JsonProperty("isFollowing")
        private boolean isFollowing; 
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserProfileDTO> getUserProfile(
            Principal principal, 
            @PathVariable String username,
            @RequestParam(required = false) String viewerUsername) {
        
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng này"));

        int followers = userRepository.countFollowers(targetUser.getId());
        boolean followingStatus = false;
        
        // 💎 CHIẾC CHÌA KHÓA VÀNG: Nếu F5 làm Token bị trễ (null), lấy ngay tên mà Frontend truyền lên
        String activeUser = (principal != null && principal.getName() != null) 
                            ? principal.getName() : viewerUsername;

        if (activeUser != null && !activeUser.isEmpty()) {
            User currentUser = userRepository.findByUsername(activeUser).orElse(null);
            if(currentUser != null){
                 // Cập nhật: check > 0 để tránh lỗi ép kiểu boolean của EXISTS
                 followingStatus = userRepository.checkFollowing(currentUser.getId(), targetUser.getId()) > 0;
            }
        }

        UserProfileDTO response = UserProfileDTO.builder()
                .id(targetUser.getId()) 
                .username(targetUser.getUsername())
                .fullName(targetUser.getFullName())
                .avatarUrl(targetUser.getAvatarUrl())
                .bio(targetUser.getBio())
                .email(targetUser.getEmail())
                .followerCount(followers) 
                .isFollowing(followingStatus) 
                .build();

        return ResponseEntity.ok(response);
    }
}