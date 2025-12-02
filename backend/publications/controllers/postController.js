const publicationPool = require("../publicationDb");

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const result = await publicationPool.query(
      `SELECT p.*, 
              COUNT(DISTINCT pl.id) as likes_count,
              COUNT(DISTINCT pc.id) as comments_count
       FROM posts p
       LEFT JOIN post_likes pl ON p.id = pl.post_id
       LEFT JOIN post_comments pc ON p.id = pc.post_id
       WHERE p.status = 'active'
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );

    res.json({
      count: result.rows.length,
      posts: result.rows,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Error fetching posts", error: err.message });
  }
};

// Get post by ID
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await publicationPool.query(
      `SELECT p.*, 
              COUNT(DISTINCT pl.id) as likes_count,
              COUNT(DISTINCT pc.id) as comments_count
       FROM posts p
       LEFT JOIN post_likes pl ON p.id = pl.post_id
       LEFT JOIN post_comments pc ON p.id = pc.post_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ message: "Error fetching post", error: err.message });
  }
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const {
      user_id,
      title,
      description,
      content,
      event_date,
      location_id,
      price,
      tickets_available,
      image_url,
    } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({ error: "Missing required fields: user_id, title" });
    }

    const result = await publicationPool.query(
      `INSERT INTO posts (user_id, title, description, content, event_date, location_id, price, tickets_available, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user_id, title, description, content, event_date, location_id, price, tickets_available, image_url]
    );

    res.status(201).json({
      message: "Post created successfully",
      post: result.rows[0],
    });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: "Error creating post", error: err.message });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const {
      title,
      description,
      content,
      event_date,
      location_id,
      price,
      tickets_available,
      image_url,
      status,
    } = req.body;

    const result = await publicationPool.query(
      `UPDATE posts 
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           content = COALESCE($4, content),
           event_date = COALESCE($5, event_date),
           location_id = COALESCE($6, location_id),
           price = COALESCE($7, price),
           tickets_available = COALESCE($8, tickets_available),
           image_url = COALESCE($9, image_url),
           status = COALESCE($10, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [postId, title, description, content, event_date, location_id, price, tickets_available, image_url, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({
      message: "Post updated successfully",
      post: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ message: "Error updating post", error: err.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await publicationPool.query(
      `DELETE FROM posts WHERE id = $1 RETURNING id`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Error deleting post", error: err.message });
  }
};

// Like a post
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "Missing required field: user_id" });
    }

    const result = await publicationPool.query(
      `INSERT INTO post_likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING
       RETURNING *`,
      [postId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ message: "Post already liked by this user" });
    }

    res.status(201).json({
      message: "Post liked successfully",
      like: result.rows[0],
    });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ message: "Error liking post", error: err.message });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "Missing required field: user_id" });
    }

    const result = await publicationPool.query(
      `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2 RETURNING id`,
      [postId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Like not found" });
    }

    res.json({ message: "Post unliked successfully" });
  } catch (err) {
    console.error("Error unliking post:", err);
    res.status(500).json({ message: "Error unliking post", error: err.message });
  }
};

// Add comment to post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id, comment } = req.body;

    if (!user_id || !comment) {
      return res.status(400).json({ error: "Missing required fields: user_id, comment" });
    }

    const result = await publicationPool.query(
      `INSERT INTO post_comments (post_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [postId, user_id, comment]
    );

    res.status(201).json({
      message: "Comment added successfully",
      comment: result.rows[0],
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Error adding comment", error: err.message });
  }
};

// Get comments for a post
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await publicationPool.query(
      `SELECT * FROM post_comments 
       WHERE post_id = $1 
       ORDER BY created_at DESC`,
      [postId]
    );

    res.json({
      count: result.rows.length,
      comments: result.rows,
    });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Error fetching comments", error: err.message });
  }
};
