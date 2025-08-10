import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CreateComment from "../components/CreateComment";
import { useUser } from "@clerk/clerk-react";

const SinglePostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${slug}`);
        if (!res.ok) {
          throw new Error("Greška prilikom dohvatanja posta.");
        }
        const data = await res.json();
        setPost(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) return <p>Učitavanje...</p>;
  if (error) return <p>Greška: {error}</p>;
  if (!post) return <p>Post nije pronađen.</p>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-gray-600 text-sm mb-1">
        Autor: {post.author_username}
      </p>
      <p className="text-gray-600 text-sm mb-4">
        Kategorija: {post.category_name}
      </p>
      <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />
        <div>
            {/* trenutno ne radi jer se komponenti salju post id i user id koji su u stvari vjerovatno samo slug i clerk id koji nisu primarni kljucevi te dodje do greske pri objavi komentara, jednostavan fix ali nisam imala vremena da zavrsim, uskoro popravljam, comming soon, TODO*/}
                {/*{isSignedIn ? (
            <CreateComment
            postId={post.id}
            userId={user.id}
            onCommentAdded={(komentar) => {
            }}
            />
        ) : (
            <div className="text-center mt-6 text-gray-600">
            <p>Morate biti prijavljeni da biste ostavili komentar.</p>
            </div>
        )}*/}
      </div>
    </div>
  );
};

export default SinglePostPage;