package com.hientranc2.socialapi.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ShareResponseDTO {
    private UUID shareId;
    private String type; // "POST" hoặc "COMMENT"
    private PostResponseDTO post;
    private CommentResponseDTO comment;
    private LocalDateTime sharedAt;
}