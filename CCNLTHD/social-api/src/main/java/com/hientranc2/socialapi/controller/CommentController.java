package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.dto.CommentResponseDTO;
import com.hientranc2.socialapi.service.CommentService;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@CrossOrigin("*")
public class CommentController {

    private final CommentService commentService;
    @Data
    public static class CreateCommentRequest {
        private String content;
        private String mediaUrl;
    }
    @PostMapping("/post/{postId}")
    public ResponseEntity<CommentResponseDTO> addComment(Principal principal, @PathVariable UUID postId, @RequestBody CreateCommentRequest request) {
        return ResponseEntity.ok(commentService.addComment(principal.getName(), postId, request.getContent(), request.getMediaUrl()));
    }

    // 🔥 API MỚI: Xử lý khi user bấm gửi Reply cho một Comment
    @PostMapping("/reply/{commentId}")
    public ResponseEntity<CommentResponseDTO> replyToComment(Principal principal, @PathVariable UUID commentId, @RequestBody CreateCommentRequest request) {
        // 🔥 Truyền thêm mediaUrl
        return ResponseEntity.ok(commentService.replyToComment(principal.getName(), commentId, request.getContent(), request.getMediaUrl()));
    }

    // 🔥 ĐÃ FIX: Kẹp thêm thân phận của user (Principal) gửi xuống Service
    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentResponseDTO>> getComments(
            Principal principal, 
            @PathVariable UUID postId,
            @RequestParam(required = false) String username) { // <--- Thêm dòng này
            
        // Ưu tiên đọc Token, nếu Token bị lơ thì dùng cái username gửi từ Frontend
        String viewerUsername = (principal != null) ? principal.getName() : username;
        return ResponseEntity.ok(commentService.getCommentsByPost(postId, viewerUsername));
    }
    @org.springframework.web.bind.annotation.GetMapping("/user/{targetUsername}")
    public org.springframework.http.ResponseEntity<java.util.List<com.hientranc2.socialapi.dto.CommentResponseDTO>> getCommentsByUser(
            java.security.Principal principal,
            @org.springframework.web.bind.annotation.PathVariable String targetUsername,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size) {
        
        String viewerUsername = (principal != null) ? principal.getName() : null;
        return org.springframework.http.ResponseEntity.ok(commentService.getCommentsByUser(targetUsername, viewerUsername, page, size));
    }
    // 🔥 API MỚI: SỬA COMMENT
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponseDTO> updateComment(Principal principal, @PathVariable UUID commentId, @RequestBody CreateCommentRequest request) {
        return ResponseEntity.ok(commentService.updateComment(principal.getName(), commentId, request.getContent(), request.getMediaUrl()));
    }

    // 🔥 API MỚI: XÓA COMMENT
    @DeleteMapping("/{commentId}")
    public ResponseEntity<String> deleteComment(Principal principal, @PathVariable UUID commentId) {
        commentService.deleteComment(principal.getName(), commentId);
        return ResponseEntity.ok("Xóa bình luận thành công");
    }
}