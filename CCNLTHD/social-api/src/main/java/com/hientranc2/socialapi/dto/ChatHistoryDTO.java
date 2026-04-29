package com.hientranc2.socialapi.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ChatHistoryDTO {
    private String senderUsername;
    private String receiverUsername;
    private String content;
    private LocalDateTime timestamp;
}