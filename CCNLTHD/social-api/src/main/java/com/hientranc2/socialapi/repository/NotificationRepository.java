package com.hientranc2.socialapi.repository;

import com.hientranc2.socialapi.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    // Lấy danh sách thông báo
    List<Notification> findAllByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    // Update trạng thái đã đọc
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient.id = :recipientId")
    void markAllAsReadByRecipientId(@Param("recipientId") UUID recipientId);

    // 🔥 THÊM DÒNG NÀY ĐỂ KHÔI PHỤC NÚT ĐẾM: Đếm số thông báo chưa đọc
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :recipientId AND n.isRead = false")
    int countUnreadNotifications(@Param("recipientId") UUID recipientId);
}