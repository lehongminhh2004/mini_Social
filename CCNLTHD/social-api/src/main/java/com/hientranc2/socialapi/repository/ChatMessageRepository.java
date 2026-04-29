package com.hientranc2.socialapi.repository;

import com.hientranc2.socialapi.model.ChatMessage;
import com.hientranc2.socialapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    
    // Tìm tin nhắn 2 chiều giữa 2 user, sắp xếp theo thời gian tăng dần (cũ nhất ở trên cùng)
    @Query("SELECT c FROM ChatMessage c WHERE (c.sender = :user1 AND c.receiver = :user2) OR (c.sender = :user2 AND c.receiver = :user1) ORDER BY c.timestamp ASC")
    List<ChatMessage> findChatHistory(@Param("user1") User user1, @Param("user2") User user2);
}