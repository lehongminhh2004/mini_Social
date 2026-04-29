package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.model.*;
import com.hientranc2.socialapi.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

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

    public List<Notification> getMyNotifications(User user) {
        return notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(user.getId());
    }
}