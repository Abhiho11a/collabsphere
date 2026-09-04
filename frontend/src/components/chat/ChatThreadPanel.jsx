import {
  ArrowLeft,
  MessageCircle,
  Send,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";


const ChatThreadPanel = ({
  parentMessage,
  messages = [],
  currentUserId,
  onClose,
  onSendReply,
}) => {

  const [input, setInput] =
    useState("");

  const bottomRef =
    useRef(null);


  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);


  if (!parentMessage) {
    return null;
  }


  const sender =
    typeof parentMessage.sender ===
    "object"
      ? parentMessage.sender
      : null;


  const senderName =
    sender?.name ||
    sender?.email ||
    "Member";


  const sendReply = () => {

    const value =
      input.trim();

    if (!value) {
      return;
    }

    onSendReply?.(
      parentMessage,
      value
    );

    setInput("");

  };


  return (

    <aside className="flex h-full w-[330px] shrink-0 flex-col border-l border-slate-800 bg-slate-950">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-800 px-4">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">

            <MessageCircle
              size={16}
            />

          </div>

          <div>

            <h3 className="text-xs font-semibold text-slate-200">
              Thread
            </h3>

            <p className="text-[9px] text-slate-600">
              Reply to this message
            </p>

          </div>

        </div>


        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-900 hover:text-slate-300"
        >

          <X
            size={15}
          />

        </button>

      </div>


      {/* =================================================
          ORIGINAL MESSAGE
      ================================================= */}

      <div className="border-b border-slate-800 p-4">

        <div className="flex items-center gap-2">

          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[8px] font-semibold text-indigo-400">

            {senderName
              .charAt(0)
              .toUpperCase()}

          </div>

          <div>

            <p className="text-[10px] font-medium text-slate-300">
              {senderName}
            </p>

            <p className="text-[8px] text-slate-600">
              Original message
            </p>

          </div>

        </div>


        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5">

          <p className="whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-400">
            {parentMessage.content}
          </p>

        </div>

      </div>


      {/* =================================================
          REPLIES
      ================================================= */}

      <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto p-4">

        {messages.length === 0 ? (

          <div className="flex h-full flex-col items-center justify-center text-center">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-700">

              <MessageCircle
                size={17}
              />

            </div>

            <p className="mt-3 text-[10px] font-medium text-slate-500">
              No replies yet
            </p>

            <p className="mt-1 text-[9px] text-slate-700">
              Start the thread below.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {messages.map(
              (message) => {

                const sender =
                  typeof message.sender ===
                  "object"
                    ? message.sender
                    : null;

                const senderId =
                  sender?._id ||
                  sender?.id ||
                  message.sender;

                const isMine =
                  String(senderId) ===
                  String(currentUserId);

                const name =
                  sender?.name ||
                  sender?.email ||
                  "Member";

                return (

                  <div
                    key={
                      message._id
                    }
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div className="max-w-[90%]">

                      {!isMine && (

                        <p className="mb-1 px-1 text-[8px] text-slate-600">
                          {name}
                        </p>

                      )}

                      <div
                        className={`rounded-xl px-3 py-2 text-[10px] leading-5 ${
                          isMine
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-900 text-slate-400"
                        }`}
                      >
                        {message.content}
                      </div>

                    </div>

                  </div>

                );

              }
            )}

            <div
              ref={bottomRef}
            />

          </div>

        )}

      </div>


      {/* =================================================
          COMPOSER
      ================================================= */}

      <div className="border-t border-slate-800 p-3">

        <div className="flex items-end gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-2">

          <textarea
            value={input}
            onChange={(event) =>
              setInput(
                event.target.value
              )
            }
            onKeyDown={(event) => {

              if (
                event.key ===
                  "Enter" &&
                !event.shiftKey
              ) {

                event.preventDefault();

                sendReply();

              }

            }}
            rows={1}
            placeholder="Reply in thread..."
            className="max-h-24 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-[10px] text-slate-300 outline-none placeholder:text-slate-700"
          />


          <button
            type="button"
            onClick={sendReply}
            disabled={!input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-30"
          >

            <Send
              size={13}
            />

          </button>

        </div>

      </div>

    </aside>

  );

};


export default ChatThreadPanel;