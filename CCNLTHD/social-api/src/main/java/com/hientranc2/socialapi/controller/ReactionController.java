package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.model.ReactionType;
import com.hientranc2.socialapi.service.ReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/reactions")
@CrossOrigin("*") // Cho phép Frontend (Next.js sau này) gọi API mà không bị lỗi block
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    // API: POST /api/reactions/post/{postId}?type=LOVE
    @PostMapping("/post/{postId}")
    public ResponseEntity<String> reactToPost(
            Principal principal,
            @PathVariable UUID postId,
            @RequestParam ReactionType type) {
        
        // principal.getName() tự động moi tên đăng nhập từ cái Token JWT mà bạn gửi lên
        String username = principal.getName();
        
        // Chuyển việc xuống cho tầng Service xử lý
        String result = reactionService.toggleReaction(username, postId, type);
        
        // Trả về câu thông báo cho Postman (hoặc Frontend)
        return ResponseEntity.ok(result);
    }
}