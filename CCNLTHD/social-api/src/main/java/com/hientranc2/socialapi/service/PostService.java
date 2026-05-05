package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.dto.PostResponseDTO;
import com.hientranc2.socialapi.dto.ShareResponseDTO; 
import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.model.ReactionType;
import com.hientranc2.socialapi.model.Share;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.CommentRepository;
import com.hientranc2.socialapi.repository.PostRepository;
import com.hientranc2.socialapi.repository.ReactionRepository;
import com.hientranc2.socialapi.repository.ShareRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // 🔥 Import mới

import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final ShareRepository shareRepository;
    private final CommentService commentService; 

    private PostResponseDTO mapToPostResponseDTO(Post post, User currentUser) {
        Map<ReactionType, Long> breakdown = new EnumMap<>(ReactionType.class);
        Arrays.stream(ReactionType.values()).forEach(t -> breakdown.put(t, 0L));
        reactionRepository.countByPostIdGroupByType(post.getId())
                .forEach(row -> breakdown.put((ReactionType) row[0], (Long) row[1]));

        boolean hasLiked = false;
        boolean hasShared = false;
        
        if (currentUser != null) {
            hasLiked = reactionRepository.findByUserIdAndPostId(currentUser.getId(), post.getId()).isPresent();
            hasShared = shareRepository.findByUserIdAndPostId(currentUser.getId(), post.getId()).isPresent();
        }
        
        int authorFollowerCount = userRepository.countFollowers(post.getUser().getId());    
        return PostResponseDTO.builder()
                .id(post.getId())
                .authorUsername(post.getUser().getUsername())
                .authorName(post.getUser().getFullName())
                .authorAvatarUrl(post.getUser().getAvatarUrl())
                .content(post.getContent())
                .mediaUrls(post.getMediaUrls()) 
                .createdAt(post.getCreatedAt())
                .totalReactions(reactionRepository.countByPostId(post.getId()))
                .totalComments(commentRepository.countByPostId(post.getId()))
                .totalShares(shareRepository.countByPostId(post.getId()))
                .reactionBreakdown(breakdown)
                .isLiked(hasLiked)
                .isShared(hasShared) 
                .authorFollowerCount(authorFollowerCount)
                .build();
    }

    public Post createPost(String username, String content, List<String> mediaUrls) { 
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Post newPost = Post.builder()
                .user(user)
                .content(content)
                .mediaUrls(mediaUrls != null ? mediaUrls : new ArrayList<>()) 
                .build();

        return postRepository.save(newPost);
    }

    // 🔥 HÀM MỚI: CẬP NHẬT BÀI VIẾT
    @Transactional
    public PostResponseDTO updatePost(UUID postId, String username, String newContent, List<String> newMediaUrls) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        if (!post.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa bài viết này");
        }

        post.setContent(newContent);
        post.setMediaUrls(newMediaUrls != null ? newMediaUrls : new ArrayList<>());
        
        return mapToPostResponseDTO(postRepository.save(post), post.getUser());
    }

    // 🔥 HÀM MỚI: XÓA BÀI VIẾT
    @Transactional
    public void deletePost(UUID postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        if (!post.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không có quyền xóa bài viết này");
        }

        // 🔥 ĐÂY LÀ ĐOẠN GIẢI QUYẾT LỖI 500: Dọn dẹp con cái trước khi xóa cha
        reactionRepository.deleteByPostId(postId);
        commentRepository.deleteByPostId(postId);
        shareRepository.deleteByPostId(postId);

        // Cuối cùng mới xóa bài viết
        postRepository.delete(post);
    }

    public List<PostResponseDTO> getNewsFeed(String username, int page, int size) {
        User currentUser = null;
        if (username != null) {
            currentUser = userRepository.findByUsername(username).orElse(null);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);

        final User finalCurrentUser = currentUser;

        return postPage.stream()
                .map(post -> mapToPostResponseDTO(post, finalCurrentUser))
                .collect(Collectors.toList());
    }

    public PostResponseDTO getPostById(String username, UUID postId) {
        User currentUser = null;
        if (username != null) {
            currentUser = userRepository.findByUsername(username).orElse(null);
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        return mapToPostResponseDTO(post, currentUser);
    }

    public List<ShareResponseDTO> getSharedPostsByUser(String currentUsername, String targetUsername, int page, int size) {
        User currentUser = null;
        if (currentUsername != null) {
            currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Share> sharedPage = shareRepository.findByUserUsernameOrderByCreatedAtDesc(targetUsername, pageable);

        final User finalCurrentUser = currentUser;
        final String viewerUsername = currentUsername;

        return sharedPage.stream().map(share -> {
            if (share.getPost() != null) {
                return ShareResponseDTO.builder()
                        .shareId(share.getId())
                        .type("POST")
                        .post(mapToPostResponseDTO(share.getPost(), finalCurrentUser))
                        .sharedAt(share.getCreatedAt())
                        .build();
            } else if (share.getComment() != null) {
                return ShareResponseDTO.builder()
                        .shareId(share.getId())
                        .type("COMMENT")
                        .comment(commentService.mapToDTO(share.getComment(), viewerUsername))
                        .sharedAt(share.getCreatedAt())
                        .build();
            }
            return null;
        }).filter(java.util.Objects::nonNull).collect(Collectors.toList());
    }
    
    public List<PostResponseDTO> getPostsByUser(String currentUsername, String targetUsername, int page, int size) {
        User currentUser = null;
        if (currentUsername != null) {
            currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.findByUserUsernameOrderByCreatedAtDesc(targetUsername, pageable);

        final User finalCurrentUser = currentUser;

        return postPage.stream()
                .map(post -> mapToPostResponseDTO(post, finalCurrentUser))
                .collect(Collectors.toList());
    }
}