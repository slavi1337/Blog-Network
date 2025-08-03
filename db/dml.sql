BEGIN;
INSERT INTO admins (id, username, password_hash) VALUES
(1, 'superadmin', 'superadmin');

INSERT INTO users (id, username, email, password_hash, first_name, last_name, role) VALUES
(1, 'ana_bloger', 'ana.bloger@example.com', 'Ana', 'Anić', 'standard'),
(2, 'marko_putnik', 'marko.putnik@example.com', 'Marko', 'Marković', 'standard'),
(3, 'jelena_citalac', 'jelena.citalac@example.com', 'Jelena', 'Jelić', 'standard'),
(4, 'ivan_moderator', 'ivan.mod@example.com', 'Ivan', 'Ivić', 'moderator');

INSERT INTO categories (id, name, slug) VALUES
(1, 'Tehnologija', 'tehnologija'),
(2, 'Putovanja', 'putovanja'),
(3, 'Kuvanje', 'kuvanje');

INSERT INTO tags (id, name) VALUES
(1, 'PostgreSQL'),
(2, 'WebDev'),
(3, 'Italija'),
(4, 'Hrana'),
(5, 'AI');

INSERT INTO media (id, uploader_user_id, file_url, file_type, file_size_bytes, mime_type) VALUES
(1, 1, 'https://picsum.photos/seed/postgres/800/400', 'image', 102400, 'image/jpeg'),
(2, 1, 'https://picsum.photos/seed/code/800/400', 'image', 204800, 'image/jpeg'),
(3, 2, 'https://picsum.photos/seed/rome/800/400', 'image', 307200, 'image/jpeg'),
(4, 2, 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', 'video', 1048576, 'video/mp4'),
(5, 2, 'https://picsum.photos/seed/pasta/800/400', 'image', 153600, 'image/jpeg');

INSERT INTO posts (id, author_id, category_id, cover_media_id, title, slug, content, status) VALUES
(1, 1, 1, 1, 'Uvod u PostgreSQL baze podataka', 'uvod-u-postgresql', 'Ovo je detaljan tekst o osnovama PostgreSQL-a...', 'published'),
(2, 1, 1, 2, 'Napredne tehnike u Web Developmentu', 'napredne-web-tehnike', 'Saznajte više o naprednim tehnikama...', 'published'),
(3, 2, 2, 3, 'Moj put u Rim: Vodič za početnike', 'put-u-rim-vodic', 'Rim je prelep grad, evo nekoliko saveta...', 'published'),
(4, 2, 3, 5, 'Jednostavan recept za pastu', 'recept-za-pastu', 'Evo kako da napravite savršenu pastu kod kuće. U videu ispod je kratak tutorijal.', 'published');

INSERT INTO post_tags (post_id, tag_id) VALUES
(1, 1), (1, 2),
(2, 2), (2, 5),
(3, 3),
(4, 3), (4, 4); 

INSERT INTO post_media (post_id, media_id, order_in_post) VALUES
(1, 2, 1), 
(4, 4, 1); 

INSERT INTO comments (id, post_id, user_id, content) VALUES
(1, 1, 3, 'Odličan članak! Hvala na objašnjenju.'),
(3, 4, 1, 'Izgleda ukusno!');
INSERT INTO comments (id, post_id, user_id, parent_comment_id, content) VALUES
(2, 1, 2, 1, 'Slažem se, baš je korisno. Planiram i ja da pišem o ovome.');

INSERT INTO post_votes (user_id, post_id, vote_type) VALUES
(1, 3, 1), (3, 1, 1), (2, 4, 1);

INSERT INTO followers (follower_id, followed_id, notifications_enabled) VALUES
(3, 1, true), (3, 2, true);

INSERT INTO blocked_users (blocker_id, blocked_id) VALUES
(2, 3);

INSERT INTO user_interested_tags (user_id, tag_id) VALUES
(3, 1), (3, 3);

INSERT INTO reading_history (user_id, post_id) VALUES
(3, 1), (1, 3);

INSERT INTO saved_posts (user_id, post_id) VALUES
(3, 2), (1, 4);

INSERT INTO notifications (recipient_id, type, related_entity_id) VALUES
(3, 'reply_to_comment', 2);

INSERT INTO moderator_permissions (moderator_id, blogger_id) VALUES
(4, 1);

INSERT INTO reported_issues (reporter_user_id, issue_type, description, related_entity_type, related_entity_id, status) VALUES
(3, 'spam', 'Mislim da je ovo spam komentar.', 'comment', 2, 'new');

SELECT setval('admins_id_seq', (SELECT MAX(id) FROM admins), true);
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories), true);
SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags), true);
SELECT setval('media_id_seq', (SELECT MAX(id) FROM media), true);
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts), true);
SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments), true);
SELECT setval('reported_issues_id_seq', (SELECT MAX(id) FROM reported_issues), true);
SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications), true);

COMMIT;