package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.dto.NotificationResponseDTO;
import com.hientranc2.socialapi.model.*;
import com.hientranc2.socialapi.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public void createNotification(User recipient, User sender, NotificationType type, UUID targetId, String message) {
        // Không tạo thông báo nếu mình tự tương tác với chính mình
        if (recipient.getId().equals(sender.getId())) return;

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(type)
                .targetId(targetId)
                .message(message)
                .build();
        notificationRepository.save(notification);
    }

    // 🔥 Đổi kiểu trả về thành List<NotificationResponseDTO>
    public List<NotificationResponseDTO> getMyNotifications(User user) {
        List<Notification> notifications = notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(user.getId());
        return notifications.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    // 🔥 HÀM MA THUẬT: Biến đổi dữ liệu và thay chữ "LIKE" thành "thả tim"
    private NotificationResponseDTO mapToDTO(Notification notification) {
        String finalMessage = notification.getMessage();
        
        // Mẹo fix chữ siêu nhanh: Nếu gặp câu cũ, tự động đổi thành câu mới
        if (finalMessage != null && finalMessage.contains("bày tỏ cảm xúc LIKE")) {
            finalMessage = finalMessage.replace("bày tỏ cảm xúc LIKE", "thả tim");
        }

        return NotificationResponseDTO.builder()
                .id(notification.getId())
                .message(finalMessage)
                .type(notification.getType())
                .targetId(notification.getTargetId())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .senderUsername(notification.getSender() != null ? notification.getSender().getUsername() : null)
                .senderFullName(notification.getSender() != null ? notification.getSender().getFullName() : null)
                .senderAvatarUrl(notification.getSender() != null ? notification.getSender().getAvatarUrl() : null)
                .build();
    }
}