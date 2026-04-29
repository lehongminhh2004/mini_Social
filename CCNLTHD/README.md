🔑 2. Luồng Xác thực (Authentication)
Dự án sử dụng JWT (JSON Web Token) để bảo mật.

Đăng nhập: Gọi API /api/users/login để lấy token.

Sử dụng: Ở tất cả các request sau (trừ Register/Login), bạn phải đính kèm Token vào Header:

Key: Authorization

Value: Bearer <your_token_here>

📡 3. Danh sách API chính (Endpoints)
👤 Người dùng (User)
POST /api/users/register: Đăng ký tài khoản.

POST /api/users/login: Đăng nhập lấy JWT.

GET /api/users/search?keyword=...: Tìm kiếm người dùng theo tên/username.

PUT /api/users/profile: Cập nhật fullName, bio, avatarUrl.

📝 Bài viết & Tương tác (Post & Social)
GET /api/posts: Lấy bảng tin (Newsfeed).

POST /api/posts: Tạo bài viết mới (content, imageUrl).

POST /api/reactions: Thả cảm xúc (postId, reactionType như LIKE, LOVE...).

POST /api/comments: Gửi bình luận (postId, content).

POST /api/shares/{postId}: Chia sẻ bài viết.

👥 Bạn bè (Friends)
POST /api/friend-requests/send/{id}: Gửi lời mời.

POST /api/friend-requests/accept/{id}: Chấp nhận lời mời.

💬 4. WebSocket (Real-time Chat & Notification)
Hệ thống sử dụng SockJS và STOMP để xử lý thời gian thực.

Kết nối: http://localhost:8080/ws

Lắng nghe tin nhắn (Subscribe): /user/{username}/queue/messages

Lắng nghe thông báo (Subscribe): /user/{username}/queue/notifications

Gửi tin nhắn (Send): /app/chat

Body: { "senderUsername": "...", "receiverUsername": "...", "content": "..." }

🖼️ 5. Upload hình ảnh
Hệ thống đã tích hợp Cloudinary.

Endpoint: POST /api/upload

Format: multipart/form-data (Key: file).

Kết quả: Trả về một chuỗi URL. Hãy dùng URL này để gửi kèm vào các API Post hoặc Update Profile.

📁 6. Quy tắc làm việc nhóm (Git)
Code Backend nằm trong: /social-api

Code Frontend vui lòng tạo thư mục: /social-web (hoặc tương tự).

Tuyệt đối: Không sửa các file trong /social-api để tránh xung đột code Java.

Trước khi làm việc: Luôn chạy git pull để cập nhật code mới nhất.