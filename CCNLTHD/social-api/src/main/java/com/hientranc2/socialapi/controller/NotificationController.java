package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.dto.NotificationResponseDTO;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.NotificationRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import com.hientranc2.socialapi.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<NotificationResponseDTO>> getNotifications(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        return ResponseEntity.ok(notificationService.getMyNotifications(user));
    }

    @PutMapping("/mark-read")
    public ResponseEntity<String> markAllAsRead(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        
        notificationRepository.markAllAsReadByRecipientId(user.getId());
        return ResponseEntity.ok("Đã đánh dấu đọc");
    }

    // 🔥 THÊM API NÀY VÀO ĐỂ KHÔI PHỤC NÚT ĐẾM TRÊN GIAO DIỆN
    @GetMapping("/unread-count")
    public ResponseEntity<Integer> getUnreadCount(Principal principal) {
        if (principal == null) return ResponseEntity.ok(0); // Tránh lỗi nếu chưa đăng nhập
        
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
                
        // Gọi hàm đếm ở Repository
        int unreadCount = notificationRepository.countUnreadNotifications(user.getId());
        return ResponseEntity.ok(unreadCount);
    }
}