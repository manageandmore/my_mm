import { ButtonAction } from "slack-edge";
import { notion } from "../../../notion";
import { slack } from "../../../slack";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { getIdeaFactoryModal } from "../views/idea_factory_modal";
import {queryIdeaFactoryItems, IdeaFactoryItem} from "../data/query_items";
import { getVoterById } from "../data/get_voter";

export const voteIdeaFactoryItemAction = "vote_idea_factory_item";

/**
 * Adds or removes a users vote when clicking the 'Vote' button for an idea factory item.
 *
 * This optimistically updates the modal with the new vote to be responsive to the user.
 * The database update is performed lazily after the modal already updated.
 */
slack.action(
  voteIdeaFactoryItemAction,
  async (request) => {
    const payload = request.payload;

    const currentUserId = payload.user.id;
    const action = payload.actions[0] as ButtonAction;

    const view = payload.view!;

    // Query idea factory items from Notion.
    // We re-fetch because private metadata of the view cannot hold JSON objects larger than 3k characters.
    const items = await queryIdeaFactoryItems(payload.user.id) as IdeaFactoryItem[];

    for (const item of items) {
      // Find the item that the user voted on.
      if (item.id == action.block_id) {
        // Flip the voting boolean and add or remove the current user from the list of voters.
        item.votedByUser = !item.votedByUser;
        if (item.votedByUser) {
          item.voters.push(await getVoterById(currentUserId));
        } else {
          item.voters = item.voters.filter((v) => v.userId != currentUserId);
        }
      }
    }

    await slack.client.views.update({
      view_id: view.id,
      view: getIdeaFactoryModal({ items }),
    });
  },
  async (request) => {
    const payload = request.payload;

    const currentUserId = payload.user.id;
    const action = payload.actions[0] as ButtonAction;
    const voted = action.value == "true";

    const view = payload.view!;

    // Query idea factory items from Notion.
    // We re-fetch because private metadata of the view cannot hold JSON objects larger than 3k characters.
    const items = await queryIdeaFactoryItems(payload.user.id) as IdeaFactoryItem[];

    // Find the item that the user voted on.
    let selectedItem: IdeaFactoryItem | null = null;
    for (let item of items) {
      if (item.id == action.block_id) {
        selectedItem = item;
      }
    }

    if (selectedItem == null) {
      throw Error(
        `Cannot find selected idea factory item with id ${action.block_id}`
      );
    }

    let relations: { id: string }[] = [];

    if (voted) {
      // Remove the current user from the list of voters and map it to the scholar relations for notion.
      relations = selectedItem.voters
        .filter((v) => v.userId != currentUserId)
        .map((v) => ({ id: v.scholarId }));
    } else {
      // Add the current user to the list of voters and map it to the scholar relations for notion.
      let scholarId = await getScholarIdFromUserId(currentUserId);
      relations = [
        ...selectedItem.voters.map((v) => ({ id: v.scholarId })),
        { id: scholarId },
      ];
    }

    // Update the Voted property of the idea_factory item in notion.
    notion.pages.update({
      page_id: selectedItem.id,
      properties: {
        Voted: {
          relation: relations,
        },
      },
    });
  }
);
