package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.dto.NotificationResponseDTO;
import com.hientranc2.socialapi.model.*;
import com.hientranc2.socialapi.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    // 🔥 Tiêm ống nước WebSocket vào đây
    private final SimpMessagingTemplate messagingTemplate;

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
        Notification savedNotification = notificationRepository.save(notification);

        // 🔥 MA THUẬT NẰM Ở ĐÂY: Vừa lưu DB xong là bắn ngay qua WebSocket
        NotificationResponseDTO dto = mapToDTO(savedNotification);
        messagingTemplate.convertAndSendToUser(
                recipient.getUsername(),
                "/queue/notifications", // Cổng ống nước dành riêng cho thông báo
                dto
        );
    }

    public List<NotificationResponseDTO> getMyNotifications(User user) {
        List<Notification> notifications = notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(user.getId());
        return notifications.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    private NotificationResponseDTO mapToDTO(Notification notification) {
        String finalMessage = notification.getMessage();
        
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