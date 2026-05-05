package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public User registerUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) throw new RuntimeException("Username đã tồn tại");
        if (userRepository.existsByEmail(user.getEmail())) throw new RuntimeException("Email đã tồn tại");
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        return userRepository.save(user);
    }

    public String login(String username, String password) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("Sai tên đăng nhập"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) throw new RuntimeException("Sai mật khẩu");
        return jwtService.generateToken(user.getUsername());
    }

    public List<User> getAllUsers() { return userRepository.findAll(); }

   public User updateProfile(String username, String fullName, String bio, String avatarUrl) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User không tồn tại"));
        user.setFullName(fullName);
        user.setBio(bio);
        
        // 🔥 Nếu có link ảnh mới truyền vào thì mới cập nhật, không thì giữ nguyên ảnh cũ
        if (avatarUrl != null && !avatarUrl.isEmpty()) {
            user.setAvatarUrl(avatarUrl);
        }
        
        return userRepository.save(user);
    }

    public List<User> searchUsers(String keyword) {
        return userRepository.findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(keyword, keyword);
    }
}