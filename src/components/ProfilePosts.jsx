import { useOutletContext } from "react-router-dom";
import PostList from "./PostList";

const ProfilePosts = () => {
  const { posts } = useOutletContext();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Moje Objave</h2>
      <PostList posts={posts} />
    </div>
  );
};

export default ProfilePosts;
