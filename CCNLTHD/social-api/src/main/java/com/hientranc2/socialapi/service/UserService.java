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
    // Logic đăng ký người dùng mới
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }
        
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username này đã được sử dụng!");
        }
        String encodedPassword = passwordEncoder.encode(user.getPasswordHash());
        user.setPasswordHash(encodedPassword);
        
        return userRepository.save(user);
        
    }

    // Logic lấy tất cả người dùng
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    public String login(String username, String password) {
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Sai tên đăng nhập hoặc mật khẩu!"));

    // Kiểm tra mật khẩu đã băm
    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
        throw new RuntimeException("Sai tên đăng nhập hoặc mật khẩu!");
    }

    // Nếu đúng, cấp Token
    return jwtService.generateToken(user.getUsername());
}
public User updateProfile(String username, String fullName, String bio, String avatarUrl) {
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    
    if (fullName != null) user.setFullName(fullName);
    if (bio != null) user.setBio(bio);
    if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
    
    return userRepository.save(user);
}
public List<User> searchUsers(String keyword) {
    return userRepository.findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(keyword, keyword);
}
}