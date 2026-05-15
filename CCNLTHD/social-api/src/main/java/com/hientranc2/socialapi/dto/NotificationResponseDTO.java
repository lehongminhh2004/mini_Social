package com.hientranc2.socialapi.dto;

import com.hientranc2.socialapi.model.NotificationType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponseDTO {
    private UUID id;
    private String message;
    private NotificationType type;
    
    // 🔥 BIẾN QUAN TRỌNG NHẤT: Lưu ID bài viết để Frontend biết đường mà chuyển trang
    private UUID targetId; 
    
    private boolean isRead;
    private LocalDateTime createdAt;
    
    // Thông tin người gửi (Làm phẳng ra cho Frontend dễ đọc)
    private String senderUsername;
    private String senderFullName;
    private String senderAvatarUrl;
}