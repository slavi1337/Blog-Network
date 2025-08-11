import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import CreateComment from "./CreateComment";

const Comment = ({ comment, onCommentAdded }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { isSignedIn } = useAuth();

  return (
    <div className="flex items-start space-x-3 py-3">
      <img
        src={comment.profile_picture_url || "/vite.svg"}
        alt={comment.username}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="flex-1">
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="font-semibold text-sm">{comment.username}</p>
          <p className="text-gray-800">{comment.content}</p>
        </div>
        <div className="text-xs text-gray-500 mt-1 flex items-center space-x-3">
          <span>{new Date(comment.created_at).toLocaleString()}</span>
          {isSignedIn && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="font-semibold hover:text-orange-600"
            >
              {showReplyForm ? "Otkaži" : "Odgovori"}
            </button>
          )}
        </div>

        {/* Forma za odgovor, prikazuje se na klik */}
        {showReplyForm && (
          <div className="mt-2">
            <CreateComment
              postId={comment.post_id}
              parentCommentId={comment.id} // id parent komentara
              onCommentAdded={(newReply) => {
                onCommentAdded(newReply);
                setShowReplyForm(false);
              }}
              isReply={true}
            />
          </div>
        )}

        <div className="pl-5 border-l-2 border-gray-200 mt-3">
          {comment.children &&
            comment.children.map((childComment) => (
              <Comment
                key={childComment.id}
                comment={childComment}
                onCommentAdded={onCommentAdded}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

const CommentSection = ({ postId, comments, onCommentAdded }) => {
  // Funkcija koja gradi stablo od ravne liste komentara
  const buildCommentTree = (commentList) => {
    const commentMap = {};
    const tree = [];

    commentList.forEach((comment) => {
      commentMap[comment.id] = { ...comment, children: [] };
    });

    Object.values(commentMap).forEach((comment) => {
      if (comment.parent_comment_id) {
        if (commentMap[comment.parent_comment_id]) {
          commentMap[comment.parent_comment_id].children.push(comment);
        }
      } else {
        // Ako nema roditelja, to je komentar najviseg nivoa
        tree.push(comment);
      }
    });

    return tree;
  };

  const commentTree = buildCommentTree(comments);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Komentari ({comments.length})</h2>
      <div className="space-y-4">
        {commentTree.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            onCommentAdded={onCommentAdded}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
