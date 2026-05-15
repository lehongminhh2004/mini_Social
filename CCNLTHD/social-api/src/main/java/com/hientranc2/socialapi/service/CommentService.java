package com.hientranc2.socialapi.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate; // 🔥 Import ống nước phát thanh
import com.hientranc2.socialapi.dto.CommentResponseDTO;
import com.hientranc2.socialapi.dto.UserSummaryDTO;
import com.hientranc2.socialapi.model.*;
import com.hientranc2.socialapi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    private final ReactionRepository reactionRepository;
    private final ShareRepository shareRepository;
    
    // 🔥 THÊM CÁI NÀY ĐỂ PHÁT THANH CHO CẢ LÀNG
    private final SimpMessagingTemplate messagingTemplate;

    public CommentResponseDTO mapToDTO(Comment comment, String fallbackUsername) {
        UserSummaryDTO authorDTO = UserSummaryDTO.builder()
                .username(comment.getUser().getUsername())
                .fullName(comment.getUser().getFullName())
                .avatarUrl(comment.getUser().getAvatarUrl())
                .build();

        boolean isLiked = false;
        boolean isShared = false;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String viewerUsername = fallbackUsername;
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            viewerUsername = auth.getName();
        }

        if (viewerUsername != null && !viewerUsername.equals("anonymousUser")) {
            Optional<User> viewerOpt = userRepository.findByUsername(viewerUsername);
            if (viewerOpt.isPresent()) {
                User viewer = viewerOpt.get();
                isLiked = reactionRepository.findByUserIdAndCommentId(viewer.getId(), comment.getId()).isPresent();
                isShared = shareRepository.findByUserIdAndCommentId(viewer.getId(), comment.getId()).isPresent();
            }
        }

        UUID parentId = comment.getParentComment() != null ? comment.getParentComment().getId() : null;
        
        String replyingTo = null;
        if (comment.getParentComment() != null) {
            replyingTo = comment.getParentComment().getUser().getUsername();
        } else {
            replyingTo = comment.getPost().getUser().getUsername();
        }

        return CommentResponseDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .mediaUrls(comment.getMediaUrls() != null ? comment.getMediaUrls() : new ArrayList<>())
                .createdAt(comment.getCreatedAt())
                .author(authorDTO)
                .totalReactions(comment.getTotalReactions() != null ? comment.getTotalReactions() : 0)
                .totalReplies(comment.getTotalReplies() != null ? comment.getTotalReplies() : 0)
                .totalShares(comment.getTotalShares() != null ? comment.getTotalShares() : 0)
                .isLiked(isLiked)   
                .isShared(isShared) 
                .parentCommentId(parentId) 
                .replyingToUsername(replyingTo) 
                .postId(comment.getPost().getId())
                .build();
    }

    public CommentResponseDTO addComment(String username, UUID postId, String content, List<String> mediaUrls) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .content(content)
                .mediaUrls(mediaUrls != null ? mediaUrls : new ArrayList<>()) 
                .build();
                
        Comment savedComment = commentRepository.save(comment);

        notificationService.createNotification(
            post.getUser(), user, NotificationType.COMMENT, post.getId(),
            user.getFullName() + " đã bình luận về bài viết của bạn."
        );

        // 🔥 PHÁT THANH
        messagingTemplate.convertAndSend("/topic/feed", "COMMENT_UPDATE");

        return mapToDTO(savedComment, username);
    }

    public CommentResponseDTO replyToComment(String username, UUID parentCommentId, String content, List<String> mediaUrls) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Comment parentComment = commentRepository.findById(parentCommentId).orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        Comment reply = Comment.builder()
                .user(user)
                .post(parentComment.getPost()) 
                .parentComment(parentComment) 
                .content(content)
                .mediaUrls(mediaUrls != null ? mediaUrls : new ArrayList<>()) 
                .build();

        Comment savedReply = commentRepository.save(reply);

        int currentReplies = parentComment.getTotalReplies() != null ? parentComment.getTotalReplies() : 0;
        parentComment.setTotalReplies(currentReplies + 1);
        commentRepository.save(parentComment);

        notificationService.createNotification(
            parentComment.getUser(), user, NotificationType.COMMENT, parentComment.getPost().getId(),
            user.getFullName() + " đã trả lời bình luận của bạn."
        );

        // 🔥 PHÁT THANH
        messagingTemplate.convertAndSend("/topic/feed", "COMMENT_UPDATE");

        return mapToDTO(savedReply, username);
    }

    @Transactional
    public CommentResponseDTO updateComment(String username, UUID commentId, String content, List<String> mediaUrls) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        if (!comment.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Không có quyền chỉnh sửa");
        }

        comment.setContent(content);
        comment.setMediaUrls(mediaUrls != null ? mediaUrls : new ArrayList<>()); 
        Comment savedComment = commentRepository.save(comment);

        // 🔥 PHÁT THANH
        messagingTemplate.convertAndSend("/topic/feed", "COMMENT_UPDATE");

        return mapToDTO(savedComment, username);
    }

    @Transactional
    public void deleteComment(String username, UUID commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        if (!comment.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Không có quyền xóa");
        }

        String postOwnerUsername = comment.getPost().getUser().getUsername();
        String parentCommentOwnerUsername = null;

        if (comment.getParentComment() != null) {
            Comment parent = comment.getParentComment();
            parentCommentOwnerUsername = parent.getUser().getUsername();
            
            int currentReplies = parent.getTotalReplies() != null ? parent.getTotalReplies() : 0;
            parent.setTotalReplies(Math.max(0, currentReplies - 1));
            commentRepository.save(parent);
        }

        reactionRepository.deleteByCommentId(commentId);
        shareRepository.deleteByCommentId(commentId);

        commentRepository.delete(comment);

        notificationService.sendSilentUpdate(postOwnerUsername);
        if (parentCommentOwnerUsername != null) {
            notificationService.sendSilentUpdate(parentCommentOwnerUsername);
        }

        // 🔥 PHÁT THANH
        messagingTemplate.convertAndSend("/topic/feed", "COMMENT_UPDATE");
    }

    public List<CommentResponseDTO> getCommentsByPost(UUID postId, String viewerUsername) {
        List<Comment> comments = commentRepository.findAllByPostIdOrderByCreatedAtDesc(postId);
        
        return comments.stream()
                .map(c -> mapToDTO(c, viewerUsername))
                .toList();
    }
    
    public List<CommentResponseDTO> getCommentsByUser(String targetUsername, String viewerUsername, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Comment> comments = commentRepository.findByUserUsernameOrderByCreatedAtDesc(targetUsername, pageable);
        
        return comments.stream()
                .map(comment -> mapToDTO(comment, viewerUsername)) 
                .collect(Collectors.toList());
    }
}