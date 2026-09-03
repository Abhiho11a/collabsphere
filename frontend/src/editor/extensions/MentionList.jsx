import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import {
  User,
} from "lucide-react";


const MentionList = forwardRef(
  (props, ref) => {
    const [
      selectedIndex,
      setSelectedIndex,
    ] = useState(0);

    const items =
      props.items || [];


    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);


    const selectItem = (index) => {
      const item =
        items[index];

      if (!item) {
        return;
      }

      props.command({
        id:
          item.id ||
          item._id,

        label:
          item.name ||
          item.email,
      });
    };


    const upHandler = () => {
      if (!items.length) {
        return;
      }

      setSelectedIndex(
        (current) =>
          (current +
            items.length -
            1) %
          items.length
      );
    };


    const downHandler = () => {
      if (!items.length) {
        return;
      }

      setSelectedIndex(
        (current) =>
          (current + 1) %
          items.length
      );
    };


    const enterHandler = () => {
      selectItem(
        selectedIndex
      );
    };


    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({
          event,
        }) => {
          if (
            event.key ===
            "ArrowUp"
          ) {
            upHandler();
            return true;
          }

          if (
            event.key ===
            "ArrowDown"
          ) {
            downHandler();
            return true;
          }

          if (
            event.key ===
            "Enter"
          ) {
            enterHandler();
            return true;
          }

          return false;
        },
      })
    );


    if (!items.length) {
      return (
        <div className="mention-list empty">
          No members found
        </div>
      );
    }


    return (
      <div className="mention-list">
        {items.map(
          (item, index) => {
            const id =
              item.id ||
              item._id;

            const active =
              index ===
              selectedIndex;

            return (
              <button
                key={id}
                type="button"
                className={
                  active
                    ? "mention-item active"
                    : "mention-item"
                }
                onMouseDown={(event) => {
                  event.preventDefault();

                  selectItem(
                    index
                  );
                }}
              >
                <span className="mention-avatar">
                  {item.avatar ? (
                    <img
                      src={
                        item.avatar
                      }
                      alt=""
                    />
                  ) : (
                    <User
                      size={14}
                    />
                  )}
                </span>

                <span className="mention-user">
                  <strong>
                    {item.name ||
                      "Unknown user"}
                  </strong>

                  <small>
                    {item.email}
                  </small>
                </span>
              </button>
            );
          }
        )}
      </div>
    );
  }
);

MentionList.displayName =
  "MentionList";

export default MentionList;