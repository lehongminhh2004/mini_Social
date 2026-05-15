package com.hientranc2.socialapi.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSummaryDTO {
    private String username;
    private String fullName;
    private String avatarUrl;
}