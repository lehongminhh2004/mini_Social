package com.hientranc2.socialapi.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
public class CommentResponseDTO {
    private UUID id;
    private String content;
    private LocalDateTime createdAt;
    private UserSummaryDTO author;
    private UUID postId;
    private String mediaUrl;
    private int totalReactions;
    private int totalReplies;
    private int totalShares;
    @JsonProperty("isLiked")
    private boolean isLiked; // Người dùng hiện tại đã thả tim cmt này chưa?
    @JsonProperty("isShared")
    private boolean isShared; // Người dùng hiện tại đã repost cmt này chưa?
    
    // Có thể trả về null nếu đây là comment gốc, trả về UUID nếu đây là reply
    private UUID parentCommentId; 
    private String replyingToUsername;
}