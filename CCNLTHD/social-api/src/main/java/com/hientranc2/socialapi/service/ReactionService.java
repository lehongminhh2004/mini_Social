package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.model.NotificationType;
import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.model.Reaction;
import com.hientranc2.socialapi.model.ReactionType;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.PostRepository;
import com.hientranc2.socialapi.repository.ReactionRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate; // 🔥 Import ống nước
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hientranc2.socialapi.model.Comment;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final com.hientranc2.socialapi.repository.CommentRepository commentRepository;
    
    // 🔥 THÊM CÁI NÀY ĐỂ PHÁT THANH CHO CẢ LÀNG
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional 
    public String toggleReaction(String username, UUID postId, ReactionType type) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        Optional<Reaction> existingReaction = reactionRepository.findByUserIdAndPostId(user.getId(), post.getId());

        String resultMessage = "";

        if (existingReaction.isPresent()) {
            Reaction reaction = existingReaction.get();
            
            if (reaction.getType() == type) {
                // Hủy tim
                reactionRepository.delete(reaction);
                notificationService.sendSilentUpdate(post.getUser().getUsername());
                resultMessage = "Đã thu hồi cảm xúc";
            } else {
                // Đổi tim (từ LIKE sang LOVE...)
                reaction.setType(type);
                reactionRepository.save(reaction);
                resultMessage = "Đã đổi sang " + type.name();
            }
        } else {
            // Thả tim mới
            Reaction newReaction = Reaction.builder()
                    .user(user)
                    .post(post)
                    .type(type)
                    .build();
            reactionRepository.save(newReaction);
            notificationService.createNotification(
                post.getUser(), 
                user, 
                NotificationType.REACTION, 
                post.getId(), 
                user.getFullName() + " đã bày tỏ cảm xúc " + type.name() + " vào bài viết của bạn."
            );
            resultMessage = "Đã thả " + type.name();
        }

        messagingTemplate.convertAndSend("/topic/feed", "REACTION_UPDATE");

        return resultMessage;
    }

    @Transactional
    public String toggleCommentReaction(String username, UUID commentId, ReactionType type) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        Optional<Reaction> existingReaction = reactionRepository.findByUserIdAndCommentId(user.getId(), comment.getId());

        String resultMessage = "";

        if (existingReaction.isPresent()) {
            Reaction reaction = existingReaction.get();
            if (reaction.getType() == type) {
                reactionRepository.delete(reaction);
                
                int currentReactions = comment.getTotalReactions() != null ? comment.getTotalReactions() : 0;
                comment.setTotalReactions(Math.max(0, currentReactions - 1));
                commentRepository.save(comment);

                notificationService.sendSilentUpdate(comment.getUser().getUsername());

                resultMessage = "Đã thu hồi cảm xúc bình luận";
            } else {
                reaction.setType(type);
                reactionRepository.save(reaction);
                resultMessage = "Đã đổi cảm xúc bình luận sang " + type.name();
            }
        } else {
            Reaction newReaction = Reaction.builder()
                    .user(user)
                    .comment(comment)
                    .type(type)
                    .build();
            reactionRepository.save(newReaction);
            
            int currentReactions = comment.getTotalReactions() != null ? comment.getTotalReactions() : 0;
            comment.setTotalReactions(currentReactions + 1);
            commentRepository.save(comment);

            notificationService.createNotification(
                comment.getUser(), 
                user, 
                NotificationType.REACTION, 
                comment.getPost().getId(), 
                user.getFullName() + " đã bày tỏ cảm xúc vào bình luận của bạn."
            );
            resultMessage = "Đã thả " + type.name() + " vào bình luận";
        }

        messagingTemplate.convertAndSend("/topic/feed", "REACTION_COMMENT_UPDATE");

        return resultMessage;
    }
}