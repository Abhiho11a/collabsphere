import {
  Check,
  CheckCheck,
  MoreVertical,
  Pencil,
  Reply,
  Smile,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";


const REACTIONS = [
  "👍",
  "❤️",
  "😂",
  "🎉",
  "🔥",
  "👏",
  "😮",
  "😢",
];


const ChatMessage = ({
  message,
  currentUserId,
  organizationChat = false,
  onDelete,
  onEdit,
  onReply,
  onReaction,
  onOpenThread,
}) => {

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [reactionOpen, setReactionOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [editValue, setEditValue] =
    useState(message?.content || "");

  const menuRef = useRef(null);


  const sender =
    typeof message?.sender === "object"
      ? message.sender
      : null;


  const senderId =
    sender?._id ||
    sender?.id ||
    message?.sender;


  const isMine =
    String(senderId) ===
    String(currentUserId);


  const senderName =
    sender?.name ||
    sender?.email ||
    "Member";


  const initials =
    senderName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("");


  const formatTime = (date) => {

    if (!date) {
      return "";
    }

    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };


  useEffect(() => {

    const handleOutsideClick = (event) => {

      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {

        setMenuOpen(false);
        setReactionOpen(false);

      }

    };


    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

    };

  }, []);


  const handleSaveEdit = () => {

    const value =
      editValue.trim();

    if (!value) {
      return;
    }

    onEdit?.(
      message._id,
      value
    );

    setEditing(false);

  };


  const handleEditKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSaveEdit();

    }

    if (
      event.key === "Escape"
    ) {

      setEditing(false);

      setEditValue(
        message?.content || ""
      );

    }

  };


  const reactions =
    message?.reactions || {};


  return (

    <div
      className={`group flex ${
        isMine
          ? "justify-end"
          : "justify-start"
      }`}
    >

      <div
        className={`flex max-w-[78%] gap-2 ${
          isMine
            ? "flex-row-reverse"
            : ""
        }`}
      >

        {/* =================================================
            AVATAR
        ================================================= */}

        {!isMine && (

          <div className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[9px] font-semibold text-indigo-400">

            {initials || "?"}

          </div>

        )}


        <div className="min-w-0">

          {/* =================================================
              SENDER
          ================================================= */}

          {organizationChat &&
            !isMine && (

            <p className="mb-1 px-1 text-[9px] font-medium text-slate-500">
              {senderName}
            </p>

          )}


          {/* =================================================
              REPLY PREVIEW
          ================================================= */}

          {message?.replyTo && (

            <button
              type="button"
              onClick={() =>
                onOpenThread?.(
                  message.replyTo
                )
              }
              className="mb-1 block max-w-full rounded-lg border-l-2 border-indigo-500/40 bg-slate-900/60 px-3 py-1.5 text-left"
            >

              <p className="text-[8px] font-medium text-indigo-400">
                Reply
              </p>

              <p className="mt-0.5 truncate text-[9px] text-slate-600">
                {typeof message.replyTo ===
                "object"
                  ? message.replyTo.content
                  : "View replied message"}
              </p>

            </button>

          )}


          {/* =================================================
              MESSAGE ROW
          ================================================= */}

          <div className="flex items-center gap-1">


            {/* =================================================
                BUBBLE
            ================================================= */}

            <div
              className={`relative rounded-2xl px-4 py-2.5 text-[11px] leading-5 ${
                message?.isDeleted
                  ? "border border-slate-800 bg-slate-900/60 italic text-slate-600"
                  : isMine
                  ? "rounded-br-md bg-indigo-600 text-white"
                  : "rounded-bl-md bg-slate-900 text-slate-300"
              }`}
            >

              {message?.isDeleted ? (

                <span>
                  {isMine
                    ? "You deleted this message"
                    : "This message was deleted"}
                </span>

              ) : editing ? (

                <div className="min-w-[220px]">

                  <textarea
                    autoFocus
                    value={editValue}
                    onChange={(event) =>
                      setEditValue(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handleEditKeyDown
                    }
                    rows={2}
                    className="w-full resize-none rounded-lg border border-white/10 bg-black/10 px-2 py-1.5 text-[11px] text-white outline-none"
                  />

                  <div className="mt-2 flex justify-end gap-1">

                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setEditValue(
                          message.content
                        );
                      }}
                      className="flex h-6 items-center gap-1 rounded-md px-2 text-[9px] text-white/60 hover:bg-white/10"
                    >
                      <X size={10} />
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleSaveEdit
                      }
                      className="rounded-md bg-white/10 px-2 text-[9px] text-white hover:bg-white/20"
                    >
                      Save
                    </button>

                  </div>

                </div>

              ) : (

                <>

                  <span className="whitespace-pre-wrap break-words">
                    {message?.content}
                  </span>

                  {message?.isEdited && (

                    <span className="ml-1 text-[8px] opacity-50">
                      edited
                    </span>

                  )}

                </>

              )}

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            {!message?.isDeleted &&
              !editing && (

              <div
                ref={menuRef}
                className="relative flex items-center opacity-0 transition group-hover:opacity-100"
              >

                <button
                  type="button"
                  onClick={() =>
                    setReactionOpen(
                      (value) => !value
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-900 hover:text-slate-400"
                  title="React"
                >

                  <Smile
                    size={13}
                  />

                </button>


                <button
                  type="button"
                  onClick={() =>
                    setMenuOpen(
                      (value) => !value
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-900 hover:text-slate-400"
                >

                  <MoreVertical
                    size={13}
                  />

                </button>


                {/* ==========================================
                    REACTION PICKER
                =========================================== */}

                {reactionOpen && (

                  <div className="absolute bottom-full left-0 z-50 mb-1 flex gap-1 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">

                    {REACTIONS.map(
                      (reaction) => (

                        <button
                          key={reaction}
                          type="button"
                          onClick={() => {

                            onReaction?.(
                              message._id,
                              reaction
                            );

                            setReactionOpen(
                              false
                            );

                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition hover:bg-slate-900"
                        >

                          {reaction}

                        </button>

                      )
                    )}

                  </div>

                )}


                {/* ==========================================
                    MESSAGE MENU
                =========================================== */}

                {menuOpen && (

                  <div
                    className={`absolute bottom-full z-50 mb-1 w-32 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl ${
                      isMine
                        ? "right-0"
                        : "left-0"
                    }`}
                  >

                    <button
                      type="button"
                      onClick={() => {

                        onReply?.(
                          message
                        );

                        setMenuOpen(
                          false
                        );

                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[10px] text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    >

                      <Reply
                        size={12}
                      />

                      Reply

                    </button>


                    {isMine && (

                      <>

                        <button
                          type="button"
                          onClick={() => {

                            setEditing(
                              true
                            );

                            setMenuOpen(
                              false
                            );

                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[10px] text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                        >

                          <Pencil
                            size={12}
                          />

                          Edit

                        </button>


                        <button
                          type="button"
                          onClick={() => {

                            onDelete?.(
                              message._id
                            );

                            setMenuOpen(
                              false
                            );

                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[10px] text-red-400 hover:bg-red-500/10"
                        >

                          <Trash2
                            size={12}
                          />

                          Delete

                        </button>

                      </>

                    )}

                  </div>

                )}

              </div>

            )}

          </div>


          {/* =================================================
              REACTIONS
          ================================================= */}

          {Object.keys(reactions).length >
            0 && (

            <div className="mt-1 flex flex-wrap gap-1">

              {Object.entries(
                reactions
              ).map(
                ([
                  emoji,
                  count,
                ]) => (

                  <button
                    key={emoji}
                    type="button"
                    onClick={() =>
                      onReaction?.(
                        message._id,
                        emoji
                      )
                    }
                    className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5 text-[9px] text-slate-400 transition hover:border-indigo-500/30 hover:bg-indigo-500/5"
                  >

                    {emoji} {count}

                  </button>

                )
              )}

            </div>

          )}


          {/* =================================================
              META
          ================================================= */}

          <div
            className={`mt-1 flex items-center gap-1 px-1 text-[8px] text-slate-700 ${
              isMine
                ? "justify-end"
                : "justify-start"
            }`}
          >

            <span>
              {formatTime(
                message?.createdAt
              )}
            </span>


            {isMine &&
              !message?.isDeleted && (

              message?.isRead ? (

                <CheckCheck
                  size={10}
                  className="text-indigo-400"
                />

              ) : (

                <Check
                  size={10}
                />

              )

            )}

          </div>

        </div>

      </div>

    </div>

  );

};


export default ChatMessage;