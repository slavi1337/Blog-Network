CREATE TYPE user_role AS ENUM ('standard', 'moderator');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived','scheduled');
CREATE TYPE notification_type AS ENUM ('new_post_from_followed', 'reply_to_comment','issue_status_change');
CREATE TYPE issue_type AS ENUM ('bug_report', 'inappropriate_content', 'spam', 'other');
CREATE TYPE issue_status AS ENUM ('new', 'in_progress', 'resolved', 'rejected');

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role NOT NULL DEFAULT 'standard',
    profile_picture_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	clerk_id VARCHAR(255) UNIQUE
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
	is_deletable BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author_id INT NOT NULL,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    status post_status NOT NULL DEFAULT 'draft',
    view_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
	publish_at TIMESTAMPTZ,
	is_pinned BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_author FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_category FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE post_tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    CONSTRAINT fk_post FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_tag FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_comment_id INT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_post FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_comment FOREIGN KEY(parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE post_votes (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    vote_type SMALLINT NOT NULL CHECK (vote_type IN (1, -1)),
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_post FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE followers (
    follower_id INT NOT NULL,
    followed_id INT NOT NULL,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (follower_id, followed_id),
    CONSTRAINT fk_follower FOREIGN KEY(follower_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_followed FOREIGN KEY(followed_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE blocked_users (
    blocker_id INT NOT NULL,
    blocked_id INT NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT fk_blocker FOREIGN KEY(blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_blocked FOREIGN KEY(blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT check_not_self_block CHECK (blocker_id <> blocked_id)
);

CREATE TABLE user_interested_tags (
    user_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (user_id, tag_id),
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tag FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE reading_history (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_post FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE saved_posts (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_post FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INT NOT NULL,
    type notification_type NOT NULL,
    related_entity_id INT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	secondary_entity_id INT,
    CONSTRAINT fk_recipient FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE moderator_permissions (
    moderator_id INT NOT NULL,
    blogger_id INT NOT NULL,
    PRIMARY KEY (moderator_id, blogger_id),
    CONSTRAINT fk_moderator FOREIGN KEY(moderator_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_blogger FOREIGN KEY(blogger_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reported_issues (
    id SERIAL PRIMARY KEY,
    reporter_user_id INT,
    issue_type issue_type NOT NULL,
    description TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id INT,
    status issue_status NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by_admin_id INT,
	screenshot_url VARCHAR(255),
    CONSTRAINT fk_reporter_user FOREIGN KEY(reporter_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_resolved_by_admin FOREIGN KEY(resolved_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE TABLE featured_post (
    id INT PRIMARY KEY DEFAULT 1,
    post_id INT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_featured_post_id FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE censored_words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL UNIQUE,
    added_by_admin_id INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_added_by_admin FOREIGN KEY(added_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX idx_reported_issues_status ON reported_issues(status);