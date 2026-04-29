package com.minisocial.api.dto;

import com.minisocial.api.entity.ReactionType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ThreadDto {

    @Data
    public static class CreateThreadRequest {
        private String content;
        private String image;
        private String replyToId;
    }

    @Data
    @Builder
    public static class ThreadResponse {
        private String id;
        private String content;
        private String image;
        private String replyToId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private AuthDto.UserDto author;
        private ThreadStats stats;
        private Map<ReactionType, Integer> reactionSummary;
        private ReactionType viewerReaction;
        
        // Include for detail view
        private List<CommentDto> comments;
        private ThreadResponse replyTo;
    }

    @Data
    @Builder
    public static class ThreadStats {
        private int replies;
        private int comments;
        private int reactions;
        private int retweets;
    }
    
    @Data
    @Builder
    public static class CommentDto {
        private String id;
        private String content;
        private LocalDateTime createdAt;
        private AuthDto.UserDto author;
    }
    
    @Data
    public static class CreateCommentRequest {
        private String content;
    }
    
    @Data
    public static class ReactionRequest {
        private ReactionType type;s
    }
}
