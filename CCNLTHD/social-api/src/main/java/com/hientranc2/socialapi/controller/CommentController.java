package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.dto.CommentResponseDTO;
import com.hientranc2.socialapi.service.CommentService;
import lombok.RequiredArgsConstructor;
import lombok.Data; 
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@CrossOrigin("*")
public class CommentController {

    private final CommentService commentService;

    // 🔥 ĐÃ ĐỔI SANG LIST VÀ LOMBOK SẼ TỰ ĐỘNG TẠO HÀM getMediaUrls()
    @Data
    public static class CreateCommentRequest {
        private String content;
        private List<String> mediaUrls; 
    }

    @PostMapping("/post/{postId}")
    public ResponseEntity<CommentResponseDTO> addComment(Principal principal, @PathVariable UUID postId, @RequestBody CreateCommentRequest request) {
        // 🔥 Đã sửa thành request.getMediaUrls()
        return ResponseEntity.ok(commentService.addComment(principal.getName(), postId, request.getContent(), request.getMediaUrls()));
    }

    @PostMapping("/reply/{commentId}")
    public ResponseEntity<CommentResponseDTO> replyToComment(Principal principal, @PathVariable UUID commentId, @RequestBody CreateCommentRequest request) {
        // 🔥 Đã sửa thành request.getMediaUrls()
        return ResponseEntity.ok(commentService.replyToComment(principal.getName(), commentId, request.getContent(), request.getMediaUrls()));
    }

    // 🔥 API SỬA COMMENT (Đã sửa thành request.getMediaUrls())
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponseDTO> updateComment(Principal principal, @PathVariable UUID commentId, @RequestBody CreateCommentRequest request) {
        return ResponseEntity.ok(commentService.updateComment(principal.getName(), commentId, request.getContent(), request.getMediaUrls()));
    }

    // 🔥 API XÓA COMMENT
    @DeleteMapping("/{commentId}")
    public ResponseEntity<String> deleteComment(Principal principal, @PathVariable UUID commentId) {
        commentService.deleteComment(principal.getName(), commentId);
        return ResponseEntity.ok("Xóa bình luận thành công");
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentResponseDTO>> getComments(
            Principal principal, 
            @PathVariable UUID postId,
            @RequestParam(required = false) String username) { 
            
        String viewerUsername = (principal != null) ? principal.getName() : username;
        return ResponseEntity.ok(commentService.getCommentsByPost(postId, viewerUsername));
    }

    @GetMapping("/user/{targetUsername}")
    public ResponseEntity<List<CommentResponseDTO>> getCommentsByUser(
            Principal principal,
            @PathVariable String targetUsername,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        String viewerUsername = (principal != null) ? principal.getName() : null;
        return ResponseEntity.ok(commentService.getCommentsByUser(targetUsername, viewerUsername, page, size));
    }
}