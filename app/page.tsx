'use client';

import { useState, useEffect } from 'react';

interface Author {
  id: string;
  name: string;
  avatar?: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  likes: number;
  loves: number;
  comments: Comment[];
}

const MOCK_USERS = ['Nguyễn Văn A', 'Trần Thị B', 'Phạm Minh C', 'Lê Hoàng D', 'Võ Tuấn E'];

const MOCK_POSTS = [
  {
    author: 'Nguyễn Văn A',
    content: 'Hôm nay thời tiết đẹp quá! 🌞 Mình vừa đi dạo ở công viên',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    author: 'Trần Thị B',
    content: 'Vừa hoàn thành project lớn! Thật vui khi làm việc với team tuyệt vời 🎉',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    author: 'Phạm Minh C',
    content: 'Ai cũng nên thử lập trình một lần, nó thực sự thú vị 💻',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    author: 'Lê Hoàng D',
    content: 'Vừa học xong khóa học về TypeScript. Tính năng này tuyệt vời!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    author: 'Võ Tuấn E',
    content: 'Gặp anh bạn cũ, nhớ những ngày học đại học lắm 😄',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [hoverPost, setHoverPost] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const API_URL = 'http://localhost:3001/api';

  useEffect(() => {
    checkAuth();
    fetchPosts();
    const interval = setInterval(fetchPosts, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        setCurrentUser(JSON.parse(user));
      }
    } catch (error) {
      console.error('Auth check failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    window.location.href = '/auth/login';
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreate = async () => {
    if (!newPost.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newPost }),
      });

      if (response.ok) {
        const createdPost = await response.json();
        setPosts([createdPost, ...posts]);
        setNewPost('');
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
    } catch (error) {
      console.error('Failed to create post');
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComments[postId];
    if (!content?.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setNewComments({ ...newComments, [postId]: '' });
        fetchPosts();
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        alert('Phiên đăng nhập đã hết hạn');
      }
    } catch (error) {
      console.error('Failed to add comment');
    }
  };

  const handleReact = async (postId: string, type: 'LIKE' | 'LOVE') => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập');
      return;
    }

    try {
      await fetch(`${API_URL}/posts/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });
      fetchPosts();
    } catch (error) {
      console.error('Failed to react');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-blue-600">facebook</h1>
          </div>
          <div className="flex gap-3 items-center">
            <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition">
              🔔
            </button>
            {!authLoading && (
              <>
                {currentUser ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {currentUser.name.charAt(0)}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-gray-700 hover:bg-red-100 text-red-600 rounded-lg transition font-semibold text-sm"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <a
                    href="/auth/login"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                  >
                    Đăng nhập
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-lg shadow p-4 sticky top-20">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Bạn bè Online</h2>
              <div className="space-y-3">
                {MOCK_USERS.map((name) => (
                  <div key={name} className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg cursor-pointer transition">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{name}</p>
                      <p className="text-xs text-green-600">Đang hoạt động</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-1">
            {/* Create Post Card */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {currentUser?.name.charAt(0) || 'Y'}
                </div>
                <input
                  type="text"
                  placeholder="Bạn đang nghĩ gì?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  onClick={() => {
                    const textarea = document.querySelector('textarea');
                    if (textarea) textarea.focus();
                  }}
                  className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-600 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent"
                />
              </div>
              {newPost && (
                <>
                  <textarea
                    className="w-full mt-3 p-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Chia sẻ suy nghĩ của bạn..."
                    rows={3}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                  />
                  <div className="mt-3 flex gap-2 pt-3 border-t border-gray-200">
                    <button className="flex-1 text-gray-600 hover:bg-gray-100 py-2 rounded-lg transition flex items-center justify-center gap-2 font-semibold text-sm">
                      🖼️ Ảnh/Video
                    </button>
                    <button className="flex-1 text-gray-600 hover:bg-gray-100 py-2 rounded-lg transition flex items-center justify-center gap-2 font-semibold text-sm">
                      😊 Cảm xúc
                    </button>
                    <button
                      onClick={handlePostCreate}
                      disabled={!newPost.trim()}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                    >
                      Đăng
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500 text-lg font-semibold">Đang tải bài viết...</p>
                </div>
              ) : posts.length === 0 && MOCK_POSTS.length > 0 ? (
                // Show mock posts if no real posts yet
                MOCK_POSTS.map((mockPost, index) => (
                  <div key={`mock-${index}`} className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {mockPost.author.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{mockPost.author}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(mockPost.createdAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <button className="text-gray-500 hover:text-gray-700">⋯</button>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-gray-900 leading-relaxed">{mockPost.content}</p>
                    </div>

                    <div className="px-4 py-2 border-y border-gray-200 text-sm text-gray-500 flex justify-between">
                      <span>👍 {Math.floor(Math.random() * 100)} ❤️ {Math.floor(Math.random() * 50)}</span>
                      <span>{Math.floor(Math.random() * 10)} bình luận</span>
                    </div>

                    <div className="p-3 flex gap-2">
                      <button className="flex-1 text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-2 rounded-lg transition font-medium flex items-center justify-center gap-2">
                        👍 Thích
                      </button>
                      <button className="flex-1 text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-2 rounded-lg transition font-medium flex items-center justify-center gap-2">
                        💬 Bình luận
                      </button>
                      <button className="flex-1 text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-2 rounded-lg transition font-medium flex items-center justify-center gap-2">
                        ↗️ Chia sẻ
                      </button>
                    </div>
                  </div>
                ))
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500 text-lg">Chưa có bài viết nào</p>
                  <p className="text-gray-400 text-sm mt-1">Hãy là người đầu tiên chia sẻ!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow">
                    {/* Post Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {post.author.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{post.author.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <button className="text-gray-500 hover:text-gray-700">⋯</button>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      <p className="text-gray-900 leading-relaxed break-words">{post.content}</p>
                    </div>

                    {/* Post Stats */}
                    <div className="px-4 py-2 border-y border-gray-200 text-sm text-gray-500 flex justify-between">
                      <span>👍 {post.likes} ❤️ {post.loves}</span>
                      <span>{post.comments.length} bình luận</span>
                    </div>

                    {/* Post Actions */}
                    <div className="p-3 flex gap-2">
                      <div
                        className="flex-1 relative"
                        onMouseEnter={() => setHoverPost(post.id)}
                        onMouseLeave={() => setHoverPost(null)}
                      >
                        <button className="w-full text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-2 rounded-lg transition font-medium flex items-center justify-center gap-2">
                          👍 Thích
                        </button>
                        {hoverPost === post.id && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-full shadow-lg p-2 flex gap-2 z-20 border border-gray-200">
                            <button
                              onClick={() => handleReact(post.id, 'LIKE')}
                              className="text-2xl hover:scale-125 transition hover:bg-gray-100 p-2 rounded-full"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => handleReact(post.id, 'LOVE')}
                              className="text-2xl hover:scale-125 transition hover:bg-gray-100 p-2 rounded-full"
                            >
                              ❤️
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setExpandedComments(
                            expandedComments === post.id ? null : post.id
                          )
                        }
                        className="flex-1 text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-2 rounded-lg transition font-medium flex items-center justify-center gap-2"
                      >
                        💬 Bình luận
                      </button>

                      <button className="flex-1 text-gray-600 hover:text-blue-600 hover:bg-gray-100 py-2 rounded-lg transition font-medium flex items-center justify-center gap-2">
                        ↗️ Chia sẻ
                      </button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments === post.id && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                          {post.comments.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-2">
                              Chưa có bình luận nào
                            </p>
                          ) : (
                            post.comments.map((comment) => (
                              <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="font-semibold text-sm text-gray-900">
                                  {comment.author}
                                </p>
                                <p className="text-gray-700 text-sm mt-1">
                                  {comment.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(comment.createdAt).toLocaleDateString(
                                    'vi-VN'
                                  )}
                                </p>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Viết bình luận..."
                            value={newComments[post.id] || ''}
                            onChange={(e) =>
                              setNewComments({
                                ...newComments,
                                [post.id]: e.target.value,
                              })
                            }
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post.id);
                              }
                            }}
                            className="flex-1 p-2 border border-gray-300 rounded-full text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-lg"
                          >
                            ➤
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-lg shadow p-4 sticky top-20">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🔥 Trending</h2>
              <div className="space-y-4">
                {['Công Nghệ', 'Lập Trình', 'Thiết Kế', 'Web Development', 'React.js'].map((trend) => (
                  <div
                    key={trend}
                    className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition border-l-4 border-blue-500"
                  >
                    <p className="font-bold text-gray-900">#{trend}</p>
                    <p className="text-gray-500 text-sm">{Math.floor(Math.random() * 50 + 10)}K posts</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
