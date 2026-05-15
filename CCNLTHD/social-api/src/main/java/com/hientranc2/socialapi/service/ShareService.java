package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.model.Comment;
import com.hientranc2.socialapi.model.NotificationType;
import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.model.Share;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.CommentRepository;
import com.hientranc2.socialapi.repository.PostRepository;
import com.hientranc2.socialapi.repository.ShareRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate; // 🔥 Import ống nước phát thanh
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShareService {

    private final ShareRepository shareRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;
    
    // 🔥 THÊM CÁI NÀY ĐỂ PHÁT THANH CHO CẢ LÀNG
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional 
    public String toggleShare(String username, UUID postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        Optional<Share> existingShare = shareRepository.findByUserIdAndPostId(user.getId(), post.getId());

        String resultMessage = "";

        if (existingShare.isPresent()) {
            shareRepository.delete(existingShare.get());
            
            int currentShares = post.getTotalShares() != null ? post.getTotalShares() : 0;
            post.setTotalShares(Math.max(0, currentShares - 1));
            postRepository.save(post);
            
            notificationService.sendSilentUpdate(post.getUser().getUsername());
            
            resultMessage = "Đã hủy đăng lại bài viết";
        } else {
            Share newShare = Share.builder().user(user).post(post).build();
            shareRepository.save(newShare);
            
            int currentShares = post.getTotalShares() != null ? post.getTotalShares() : 0;
            post.setTotalShares(currentShares + 1);
            postRepository.save(post);
            
            notificationService.createNotification(
                post.getUser(), user, NotificationType.SHARE, post.getId(), 
                user.getFullName() + " đã đăng lại bài viết của bạn."
            );
            resultMessage = "Đã đăng lại bài viết thành công!";
        }

        // 🔥 PHÁT THANH
        messagingTemplate.convertAndSend("/topic/feed", "SHARE_UPDATE");
        
        return resultMessage;
    }

    @Transactional
    public String toggleCommentShare(String username, UUID commentId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        Optional<Share> existingShare = shareRepository.findByUserIdAndCommentId(user.getId(), comment.getId());

        String resultMessage = "";

        if (existingShare.isPresent()) {
            shareRepository.delete(existingShare.get());
            
            int currentShares = comment.getTotalShares() != null ? comment.getTotalShares() : 0;
            comment.setTotalShares(Math.max(0, currentShares - 1));
            commentRepository.save(comment);

            notificationService.sendSilentUpdate(comment.getUser().getUsername());

            resultMessage = "Đã hủy đăng lại bình luận";
        } else {
            Share newShare = Share.builder()
                    .user(user)
                    .comment(comment) 
                    .build();
            shareRepository.save(newShare);
            
            int currentShares = comment.getTotalShares() != null ? comment.getTotalShares() : 0;
            comment.setTotalShares(currentShares + 1);
            commentRepository.save(comment);

            notificationService.createNotification(
                comment.getUser(), user, NotificationType.SHARE, comment.getPost().getId(), 
                user.getFullName() + " đã đăng lại bình luận của bạn."
            );
            resultMessage = "Đã đăng lại bình luận thành công!";
        }

        // 🔥 PHÁT THANH
        messagingTemplate.convertAndSend("/topic/feed", "SHARE_UPDATE");

        return resultMessage;
    }
}