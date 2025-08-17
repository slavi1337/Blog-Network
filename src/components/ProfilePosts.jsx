import { useOutletContext } from "react-router-dom";
import PostList from "./PostList";

const ProfilePosts = () => {
  const { posts, isOwnProfile } = useOutletContext();

  console.log("Podaci stigli u ProfilePosts:", posts);
  if (posts && posts.length > 0) {
    console.log("Prvi post u ProfilePosts:", posts[0]);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {isOwnProfile ? "Moje Objave" : "Objave"}
      </h2>
      <PostList posts={posts} />
    </div>
  );
};

export default ProfilePosts;
