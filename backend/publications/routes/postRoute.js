const router = require("express").Router();
const postController = require("../controllers/postController");

// Get all posts
router.get("/", postController.getAllPosts);

// Get post by ID
router.get("/:postId", postController.getPostById);

// Create a new post
router.post("/", postController.createPost);

// Update a post
router.patch("/:postId", postController.updatePost);

// Delete a post
router.delete("/:postId", postController.deletePost);

// Like a post
router.post("/:postId/like", postController.likePost);

// Unlike a post
router.delete("/:postId/like", postController.unlikePost);

// Add comment to post
router.post("/:postId/comments", postController.addComment);

// Get comments for a post
router.get("/:postId/comments", postController.getPostComments);

module.exports = router;
