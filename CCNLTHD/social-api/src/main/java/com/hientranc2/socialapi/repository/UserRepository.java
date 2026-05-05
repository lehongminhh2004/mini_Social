package com.hientranc2.socialapi.repository;

import com.hientranc2.socialapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<User> findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(String username, String fullName);
    
    @Query(value = "SELECT COUNT(*) FROM user_follows WHERE followed_id = :userId", nativeQuery = true)
    int countFollowers(@Param("userId") UUID userId);

   // Đổi hàm checkFollowing thành như sau:
    @Query(value = "SELECT COUNT(*) FROM user_follows WHERE follower_id = :followerId AND followed_id = :followedId", nativeQuery = true)
    int checkFollowing(@Param("followerId") UUID followerId, @Param("followedId") UUID followedId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(value = "INSERT INTO user_follows (follower_id, followed_id) VALUES (:followerId, :followedId)", nativeQuery = true)
    void follow(@Param("followerId") UUID followerId, @Param("followedId") UUID followedId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(value = "DELETE FROM user_follows WHERE follower_id = :followerId AND followed_id = :followedId", nativeQuery = true)
    void unfollow(@Param("followerId") UUID followerId, @Param("followedId") UUID followedId);
}