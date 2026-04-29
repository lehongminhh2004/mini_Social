package com.hientranc2.socialapi.dto;

import com.hientranc2.socialapi.model.ReactionType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class PostResponseDTO {
    private UUID id;
    private String authorUsername;   // Dùng để navigate đến /profile/[username]
    private String authorName;       // fullName để hiển thị
    private String authorAvatarUrl;  // Avatar hiển thị trong PostCard
    private String content;
    private String mediaUrl;
    private LocalDateTime createdAt;

    // Thống kê tương tác
    private int totalReactions;
    private int totalComments;
    private int totalShares;

    // Breakdown từng loại reaction để FE hiển thị emoji riêng
    private Map<ReactionType, Long> reactionBreakdown;
}
