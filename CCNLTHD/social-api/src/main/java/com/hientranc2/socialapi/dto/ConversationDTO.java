package com.hientranc2.socialapi.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ConversationDTO {
    private String partnerUsername;
    private String partnerFullName;
    private String partnerAvatarUrl;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount; 
}