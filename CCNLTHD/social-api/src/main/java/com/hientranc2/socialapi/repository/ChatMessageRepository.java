package com.hientranc2.socialapi.repository;

import com.hientranc2.socialapi.model.ChatMessage;
import com.hientranc2.socialapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    
    @Query("SELECT c FROM ChatMessage c WHERE (c.sender = :user1 AND c.receiver = :user2) OR (c.sender = :user2 AND c.receiver = :user1) ORDER BY c.timestamp ASC")
    List<ChatMessage> findChatHistory(@Param("user1") User user1, @Param("user2") User user2);

    long countByReceiverIdAndIsReadFalse(UUID receiverId);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage c SET c.isRead = true WHERE c.receiver.id = :myId AND c.sender.username = :partnerUsername AND c.isRead = false")
    void markMessagesAsRead(@Param("myId") UUID myId, @Param("partnerUsername") String partnerUsername);

    // 🔥 HÀM MỚI 1: Lấy TOÀN BỘ tin nhắn của mình để lọc ra danh sách hội thoại
    @Query("SELECT c FROM ChatMessage c WHERE c.sender.id = :userId OR c.receiver.id = :userId ORDER BY c.timestamp DESC")
    List<ChatMessage> findAllMessagesByUserId(@Param("userId") UUID userId);

    // 🔥 HÀM MỚI 2: Đếm số tin nhắn chưa đọc TỪ 1 NGƯỜI CỤ THỂ
    @Query("SELECT COUNT(c) FROM ChatMessage c WHERE c.receiver.id = :userId AND c.sender.username = :partnerUsername AND c.isRead = false")
    long countUnreadFromPartner(@Param("userId") UUID userId, @Param("partnerUsername") String partnerUsername);
}