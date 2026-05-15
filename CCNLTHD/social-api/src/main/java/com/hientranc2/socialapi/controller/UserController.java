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
import com.hientranc2.socialapi.dto.ChangePasswordRequest;
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
    @GetMapping("/{username}/followers")
    public ResponseEntity<List<UserProfileDTO>> getFollowers(@PathVariable String username) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng này"));

        // Lấy danh sách user từ bảng follow (cần viết hàm tìm kiếm trong Repository)
        // Lưu ý: Nếu bạn chưa có hàm getFollowers trong userRepository, 
        // hãy xem BƯỚC 1.1 bên dưới để thêm vào.
        List<User> followers = userRepository.getFollowers(targetUser.getId());

        // Chuyển đổi sang DTO để trả về Frontend
        List<UserProfileDTO> responseList = followers.stream().map(user -> UserProfileDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                // Các trường khác tạm để mặc định, vì danh sách chỉ cần hiển thị tên và ảnh
                .build()
        ).toList();

        return ResponseEntity.ok(responseList);
    }
    @PutMapping("/password")
    public ResponseEntity<String> changePassword(Principal principal, @RequestBody ChangePasswordRequest request) {
        try {
            // Lấy username của người dùng đang đăng nhập từ Principal
            String username = principal.getName();
            
            // Gọi service để thực hiện đổi mật khẩu
            userService.changePassword(username, request.getOldPassword(), request.getNewPassword());
            
            return ResponseEntity.ok("Đổi mật khẩu thành công");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}