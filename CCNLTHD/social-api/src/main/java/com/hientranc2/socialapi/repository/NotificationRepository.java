package com.hientranc2.socialapi.repository;

import com.hientranc2.socialapi.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    // Lấy danh sách thông báo của một người, cái mới nhất lên đầu
    List<Notification> findAllByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
}