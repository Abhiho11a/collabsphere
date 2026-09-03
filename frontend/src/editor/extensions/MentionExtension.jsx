import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";

import MentionList from "./MentionList";

const MentionExtension = ({
  membersRef,
}) => {
  return Mention.configure({
    HTMLAttributes: {
      class: "document-mention",
    },

    suggestion: {
      char: "@",

      items: ({ query }) => {
        const members =
          membersRef?.current || [];

        const normalizedQuery =
          query
            .toLowerCase()
            .trim();

        return members
          .filter((member) => {
            const name =
              (
                member.name || ""
              ).toLowerCase();

            const email =
              (
                member.email || ""
              ).toLowerCase();

            return (
              name.includes(
                normalizedQuery
              ) ||
              email.includes(
                normalizedQuery
              )
            );
          })
          .slice(0, 8);
      },

      render: () => {
        let component;
        let popup;

        return {
          onStart: (props) => {
            component =
              new ReactRenderer(
                MentionList,
                {
                  props,
                  editor:
                    props.editor,
                }
              );

            if (!props.clientRect) {
              return;
            }

            popup = tippy(
              "body",
              {
                getReferenceClientRect:
                  props.clientRect,

                appendTo: () =>
                  document.body,

                content:
                  component.element,

                showOnCreate: true,

                interactive: true,

                trigger: "manual",

                placement:
                  "bottom-start",
              }
            );
          },

          onUpdate: (props) => {
            component.updateProps(
              props
            );

            if (
              !props.clientRect ||
              !popup
            ) {
              return;
            }

            popup[0].setProps({
              getReferenceClientRect:
                props.clientRect,
            });
          },

          onKeyDown: (props) => {
            if (
              props.event.key ===
              "Escape"
            ) {
              popup?.[0]?.hide();

              return true;
            }

            return (
              component?.ref?.onKeyDown(
                props
              ) || false
            );
          },

          onExit: () => {
            popup?.[0]?.destroy();
            component?.destroy();
          },
        };
      },
    },
  });
};

export default MentionExtension;