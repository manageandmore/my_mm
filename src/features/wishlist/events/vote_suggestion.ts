import { ButtonAction } from "slack-edge";
import { notion } from "../../../notion";
import { slack } from "../../../slack";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { getWishlistModal } from "../views/wishlist_modal";
import {queryWishlistItems, WishlistItem} from "../data/query_items";
import { getVoterById } from "../data/get_voter";

export const voteWishlistItemAction = "vote_wishlist_item";

/**
 * Adds or removes a users vote when clicking the 'Vote' button for a wishlist item.
 *
 * This optimistically updates the modal with the new vote to be responsive to the user.
 * The database update is performed lazily after the modal already updated.
 */
slack.action(
  voteWishlistItemAction,
  async (request) => {
    const payload = request.payload;

    const currentUserId = payload.user.id;
    const action = payload.actions[0] as ButtonAction;

    const view = payload.view!;

    // Query wishlist items from Notion.
    // We re-fetch because private metadata of the view cannot hold JSON objects larger than 3k characters.
    const items = await queryWishlistItems(payload.user.id) as WishlistItem[];

    for (var item of items) {
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
      view: getWishlistModal({ items }),
    });
  },
  async (request) => {
    const payload = request.payload;

    const currentUserId = payload.user.id;
    const action = payload.actions[0] as ButtonAction;
    const voted = action.value == "true";

    const view = payload.view!;

    // Query wishlist items from Notion.
    // We re-fetch because private metadata of the view cannot hold JSON objects larger than 3k characters.
    const items = await queryWishlistItems(payload.user.id) as WishlistItem[];

    // Find the item that the user voted on.
    let selectedItem: WishlistItem | null = null;
    for (let item of items) {
      if (item.id == action.block_id) {
        selectedItem = item;
      }
    }

    if (selectedItem == null) {
      throw Error(
        `Cannot find selected wishlist item with id ${action.block_id}`
      );
    }

    var relations: { id: string }[] = [];

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

    // Update the Voted property of the wishlist item in notion.
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
