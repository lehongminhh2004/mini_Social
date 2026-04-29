package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.hientranc2.socialapi.dto.PostResponseDTO;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin("*")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // API Đăng bài mới
    @PostMapping
    public ResponseEntity<Post> createPost(Principal principal, @RequestBody Map<String, String> request) {
        // principal.getName() chính là username được bóc ra từ Token JWT!
        String username = principal.getName(); 
        String content = request.get("content");
        String mediaUrl = request.get("mediaUrl"); // Có thể null nếu chỉ đăng chữ

        Post savedPost = postService.createPost(username, content, mediaUrl);
        return ResponseEntity.ok(savedPost);
    }

    // API Lấy danh sách bài viết
    @GetMapping
   public ResponseEntity<List<PostResponseDTO>> getAllPosts(
            // Nếu người dùng không gửi gì, tự động lấy trang 0 (trang đầu), mỗi trang 5 bài
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        return ResponseEntity.ok(postService.getNewsFeed(page, size));
    }
}