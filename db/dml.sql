BEGIN;

-- inace se u finalnoj verziji appa korisi hash i kreira se nalog preko skripte, ali ovo je pokazni dml samo
INSERT INTO admins (id, username, password_hash) VALUES
(1, 'superadmin', 'superadmin');

INSERT INTO users (id, clerk_id, username, email, first_name, last_name, role) VALUES
(1, 'clerk_id_1', 'ana_bloger', 'ana.bloger@example.com', 'Ana', 'Anić', 'standard'),
(2, 'clerk_id_2', 'marko_putnik', 'marko.putnik@example.com', 'Marko', 'Marković', 'standard'),
(3, 'clerk_id_3', 'jelena_citalac', 'jelena.citalac@example.com', 'Jelena', 'Jelić', 'standard'),
(4, 'clerk_id_4', 'ivan_moderator', 'ivan.mod@example.com', 'Ivan', 'Ivić', 'moderator');
INSERT INTO categories (id, name, slug, is_deletable) VALUES
(1, 'Ostalo', 'ostalo', FALSE),         
(2, 'Tehnologija', 'tehnologija', TRUE),
(3, 'Putovanja', 'putovanja', TRUE),   
(4, 'Kuvanje', 'kuvanje', TRUE);

INSERT INTO tags (id, name) VALUES
(1, 'PostgreSQL'),
(2, 'WebDev'),
(3, 'Italija'),
(4, 'Hrana'),
(5, 'AI');

INSERT INTO posts (id, author_id, category_id, title, slug, content, status) VALUES
(1, 1, 2, 'Uvod u PostgreSQL baze podataka', 'uvod-u-postgresql', 
 '<p>Ovo je detaljan tekst o osnovama PostgreSQL-a...</p><img src="https://ik.imagekit.io/blognetworkslavisa/postgres-image.jpg">', 'published'),
(2, 1, 2, 'Napredne tehnike u Web Developmentu', 'napredne-web-tehnike', 
 '<p>Saznajte više o naprednim tehnikama...</p><img src="https://ik.imagekit.io/blognetworkslavisa/webdev-image.jpg">', 'published'),
(3, 2, 3, 'Moj put u Rim: Vodič za početnike', 'put-u-rim-vodic', 
 '<p>Rim je prelep grad, evo nekoliko saveta...</p><img src="https://ik.imagekit.io/blognetworkslavisa/rim-image.jpg">', 'published'),
(4, 2, 4, 'Jednostavan recept za pastu', 'recept-za-pastu', 
 '<p>Evo kako da napravite savršenu pastu kod kuće.</p><iframe src="https://ik.imagekit.io/blognetworkslavisa/pasta-video.mp4"></iframe>', 'published');

INSERT INTO post_tags (post_id, tag_id) VALUES
(1, 1), (1, 2),
(2, 2), (2, 5),
(3, 3),
(4, 4); 

INSERT INTO comments (id, post_id, user_id, content, parent_comment_id) VALUES
(1, 1, 3, 'Odličan članak! Hvala na objašnjenju.', NULL),
(2, 1, 2, 'Slažem se, baš je korisno.', 1),
(3, 4, 1, 'Izgleda ukusno!', NULL);

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
(1, 'reply_to_comment', 1); 

INSERT INTO moderator_permissions (moderator_id, blogger_id) VALUES
(4, 1);

INSERT INTO reported_issues (reporter_user_id, issue_type, description, related_entity_type, related_entity_id, status) VALUES
(3, 'spam', 'Mislim da je ovo spam komentar.', 'comment', 2, 'new');

SELECT setval('admins_id_seq', (SELECT MAX(id) FROM admins), true);
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories), true);
SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags), true);
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts), true);
SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments), true);
SELECT setval('reported_issues_id_seq', (SELECT MAX(id) FROM reported_issues), true);
SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications), true);

COMMIT;