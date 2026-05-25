import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import InfiniteScroll from "react-infinite-scroll-component";
import PostList from "../components/PostList";

const ForYouPage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const { getToken } = useAuth();
  const { isSignedIn, isLoaded } = useUser();
  const POST_API = import.meta.env.VITE_POST_API;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const fetchInitialPosts = async () => {
      if (!isSignedIn) {
        setError("Morate biti prijavljeni da biste vidjeli ovu stranicu.");
        setHasMore(false);
        setInitialLoad(false);
        return;
      }

      setError(null);
      setInitialLoad(true);
      try {
        const token = await getToken();
        const res = await fetch(`${POST_API}/api/posts/foryou?page=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP greška! status: ${res.status}`);
        }

        const data = await res.json();

        setPosts(data.posts || []);
        setHasMore(data.hasMore);
        setPage(2);
      } catch (err) {
        console.error("Greška prilikom dohvatanja objava:", err);
        setError("Došlo je do greške prilikom učitavanja objava.");
        setHasMore(false);
      } finally {
        setInitialLoad(false);
      }
    };

    fetchInitialPosts();
  }, [isLoaded, isSignedIn, getToken]);

  const fetchMorePosts = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${POST_API}/api/posts/foryou?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setPosts((prev) => [...prev, ...(data.posts || [])]);
      setHasMore(data.hasMore);
      setPage((prevPage) => prevPage + 1);
    } catch (err) {
      console.error("Greška prilikom dohvatanja dodatnih objava:", err);
    }
  };

  if (!isLoaded) {
    return <div className="text-center p-10 font-semibold">Učitavanje...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-primary pb-2">
        Za Tebe
      </h1>
      <p className="text-gray-600 mb-6">
        Najnovije objave autora i tagova koje pratite na jednom mjestu!
      </p>

      {error && (
        <p className="text-red-500 text-center bg-red-100 p-4 rounded-md">
          {error}
        </p>
      )}

      {!error && (
        <InfiniteScroll
          dataLength={posts.length}
          next={fetchMorePosts}
          hasMore={hasMore}
          loader={
            <h4 className="text-center text-gray-500 py-4">Učitavanje...</h4>
          }
          endMessage={
            !initialLoad && posts.length > 0 ? (
              <p className="text-center text-gray-400 mt-4">
                <b>Stigli ste do kraja.</b>
              </p>
            ) : null
          }
        >
          <PostList posts={posts} />
        </InfiniteScroll>
      )}

      {!initialLoad && posts.length === 0 && !error && (
        <div className="text-center py-10">
          <p className="text-gray-500">
            Nema objava od autora ili tagova koje pratite.
          </p>
          <p className="text-gray-400 mt-2">
            Pokušajte zapratiti još autora ili tagova kako biste vidjeli
            sadržaj.
          </p>
        </div>
      )}
    </div>
  );
};

export default ForYouPage;
