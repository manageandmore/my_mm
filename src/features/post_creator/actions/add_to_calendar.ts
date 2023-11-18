import {
  AnyRichTextBlockElement,
  ButtonAction,
  PlainTextOption,
  RichTextSectionElement,
  RichTextSectionEmoji,
  RichTextSectionLink,
  RichTextSectionText,
} from "slack-edge";
import { slack } from "../../../slack";
import { getContentSchedulerModal } from "../views/content_scheduler_modal";
import { PostCreatorOptions, getPostImageUrl } from "../image_utils";
import { addPostToContentCalendar } from "../data/add_post";
import { ONE_DAY } from "../../common/time_utils";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { RichTextItemRequest } from "../../../notion";

export const addToCalendarAction = "add_to_content_calendar";

/**
 * Opens the post creator modal when the user clicks the "Create Social Media Post" button.
 */
slack.action(addToCalendarAction, async (request) => {
  const payload = request.payload;

  const options = JSON.parse(
    (payload.actions[0] as ButtonAction).value
  ) as PostCreatorOptions;

  await slack.client.views.open({
    trigger_id: payload.trigger_id,
    view: getContentSchedulerModal(options),
  });
});

export const addToCalendarCallback = "add_to_content_calendar_callback";

slack.viewSubmission(
  addToCalendarCallback,
  async (request) => {
    const payload = request.payload;

    const state = payload.view.state.values as ContentSchedulerModalState;

    let errors = validateState(state);
    if (errors != null) {
      return {
        response_action: "errors",
        errors: errors,
      };
    }
  },
  async (request) => {
    const payload = request.payload;

    const state = payload.view.state.values as ContentSchedulerModalState;

    if (validateState(state) != null) return;

    const options = JSON.parse(
      payload.view.private_metadata
    ) as PostCreatorOptions;

    const content = pageBlocksFromRichText(
      state.content?.content.rich_text_value.elements ?? []
    );

    const page = await addPostToContentCalendar({
      title: options.title ?? "",
      date: state.date!.date.selected_date,
      channels: state.channels!.channels.selected_options.map(
        (o) => o.text.text
      ),
      content: [
        ...content,
        {
          type: "image",
          image: {
            external: {
              url: getPostImageUrl(
                { ...options, size: 1200 },
                { encode: true }
              ),
            },
            caption: [{ type: "text", text: { content: options.title ?? "" } }],
          },
        },
      ],
    });

    await slack.client.chat.postMessage({
      channel: payload.user.id,
      text: "Great, I added the post to the content calendar.",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Great, I added the post to the content calendar. 🙏 Thanks for helping us with your amazing content for the MM socials.",
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "View in Notion",
            },
            url: page.url,
          },
        },
      ],
    });
  }
);

interface ContentSchedulerModalState {
  content?: {
    content: { rich_text_value: { elements: RichTextElement[] } };
  };
  date?: { date: { selected_date: string } };
  channels?: { channels: { selected_options: PlainTextOption[] } };
}

type RichTextElement = AnyRichTextBlockElement | RichTextSectionElement;

function validateState(
  state: ContentSchedulerModalState
): { [blockId: string]: string } | null {
  const date = state.date?.date.selected_date;
  const channels = state.channels?.channels.selected_options ?? [];

  if (date == null) {
    return {
      date: "Date is required.",
    };
  }

  if (Date.parse(date) < Date.now() + ONE_DAY * 2) {
    return {
      date: "Date must be earliest in two days.",
    };
  }

  if (channels.length == 0) {
    return {
      channels: "Select at least one channel.",
    };
  }

  return null;
}

function pageBlocksFromRichText(
  elements: RichTextElement[]
): BlockObjectRequest[] {
  let blocks: BlockObjectRequest[] = [];

  for (var element of elements) {
    if (element.type == "rich_text_quote") {
      blocks.push({
        type: "quote",
        quote: {
          rich_text: (element.elements as RichTextElement[]).flatMap(
            richTextBlocksFromElement
          ),
        },
      });
    } else if (element.type == "rich_text_list") {
      let style = element.style;
      for (var e of element.elements as RichTextElement[]) {
        if (style == "bullet") {
          blocks.push({
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: richTextBlocksFromElement(e),
            },
          });
        } else {
          blocks.push({
            type: "numbered_list_item",
            numbered_list_item: {
              rich_text: richTextBlocksFromElement(e),
            },
          });
        }
      }
    } else if (element.type == "rich_text_preformatted") {
      blocks.push({
        type: "code",
        code: {
          rich_text: (element.elements as RichTextElement[]).flatMap(
            richTextBlocksFromElement
          ),
          language: "javascript",
        },
      });
    } else {
      blocks.push({
        type: "paragraph",
        paragraph: {
          rich_text: richTextBlocksFromElement(element),
        },
      });
    }
  }

  return blocks;
}

function richTextBlocksFromElement(
  element: RichTextElement
): RichTextItemRequest[] {
  if (element.type == "rich_text_section") {
    return element.elements.flatMap(richTextBlocksFromElement);
  } else if (isTextElement(element)) {
    if (element.text.trim().length == 0) {
      return [];
    }
    return [
      {
        type: "text",
        text: {
          content: element.text,
        },
        annotations: {
          bold: element.style?.bold,
          italic: element.style?.italic,
          strikethrough: element.style?.strike,
          code: element.style?.code,
        },
      },
    ];
  } else if (isLinkElement(element)) {
    return [
      {
        type: "text",
        text: {
          content: element.text,
          link: {
            url: element.url,
          },
        },
        annotations: {
          bold: element.style?.bold,
          italic: element.style?.italic,
          strikethrough: element.style?.strike,
          code: element.style?.code,
        },
      },
    ];
  } else if (isEmojiElement(element)) {
    console.log(element);
    return [
      {
        type: "text",
        text: {
          content: String.fromCodePoint(
            ...element.unicode.split("-").map((i) => Number.parseInt(i, 16))
          ),
        },
        annotations: {
          bold: element.style?.bold,
          italic: element.style?.italic,
          strikethrough: element.style?.strike,
          code: element.style?.code,
        },
      },
    ];
  } else {
    return [
      {
        type: "text",
        text: {
          content: JSON.stringify(element),
        },
        annotations: {
          strikethrough: true,
        },
      },
    ];
  }
}

function isTextElement(
  element: RichTextElement
): element is RichTextSectionText {
  return element.type == "text";
}
function isLinkElement(
  element: RichTextElement
): element is RichTextSectionLink {
  return element.type == "link";
}

function isEmojiElement(
  element: RichTextElement
): element is RichTextSectionEmoji {
  return element.type == "emoji";
}
