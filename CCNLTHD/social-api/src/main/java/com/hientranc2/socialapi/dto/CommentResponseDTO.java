package com.hientranc2.socialapi.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CommentResponseDTO {
    private UUID id;
    private String content;
    private LocalDateTime createdAt;
    
    // Đặt tên là author để Frontend gõ comment.author.avatarUrl là ăn luôn!
    private UserSummaryDTO author; 
}