import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import CreateComment from "./CreateComment";

const Comment = ({ comment, onCommentAdded, canManage, onDeleteComment }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const isCommentAuthor = user?.username === comment.username;
  const canDeleteThisComment = canManage || isCommentAuthor;

  return (
    <div className="flex items-start space-x-3 py-3 w-full">
      <div className="flex-1 w-full">
        <div className="bg-gray-100 rounded-lg p-3 w-full">
          <div className="flex items-start gap-x-3">
            <img
              src={comment.profile_picture_url || "/vite.svg"}
              alt={comment.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm whitespace-normal break-words">
                {comment.username}
              </p>
              <p className="text-gray-800 whitespace-normal break-words mt-1">
                {comment.content}
              </p>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1 flex items-center space-x-3">
          <span>{new Date(comment.created_at).toLocaleString()}</span>
          {isSignedIn && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="font-semibold hover:text-primary-accent"
            >
              {showReplyForm ? "Otkaži" : "Odgovori"}
            </button>
          )}
          {canDeleteThisComment && (
            <button
              onClick={() => onDeleteComment(comment.id)}
              className="font-semibold text-red-500 hover:text-red-700"
            >
              Obriši
            </button>
          )}
          <label className="font-bold text-l">ID: {comment.id}</label>
          <label>Reply to: {comment.parent_comment_id}</label>
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

        <div className="pl-0 md:pl-12 md:border-l-2 border-gray-200 mt-3">
          {comment.children &&
            comment.children.map((childComment) => (
              <Comment
                key={childComment.id}
                comment={childComment}
                onCommentAdded={onCommentAdded}
                canManage={canManage}
                onDeleteComment={onDeleteComment}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

const CommentSection = ({
  postId,
  comments,
  onCommentAdded,
  canManage,
  onDeleteComment,
}) => {
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
            canManage={canManage}
            onDeleteComment={onDeleteComment}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
