package com.hientranc2.socialapi.repository;
import java.util.List;
import com.hientranc2.socialapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    // Tìm user theo email hoặc username
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    // Kiểm tra xem email hoặc username đã tồn tại chưa
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<User> findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(String username, String fullName);
}