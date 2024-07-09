import { ButtonAction } from "slack-edge";
import { notion } from "../../../notion";
import { slack } from "../../../slack";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { getWishlistModal } from "../views/wishlist_modal";
import { WishlistItem, queryWishlistItems } from "../data/query_items";
import { getVoterById } from "../data/get_voter";
import { toggleWishlistVote } from "../data/toggle_vote";
import { ONE_DAY } from "../../common/time_utils";
import { cache } from "../../common/cache";

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
    const items = await queryWishlistItems();

    for (var item of items) {
      // Find the item that the user voted on.
      if (item.id == action.block_id) {
        // Add or remove the current user from the list of voters.
        if (item.voters.find((v) => v.userId == currentUserId)) {
          item.voters = item.voters.filter((v) => v.userId != currentUserId);
        } else {
          item.voters.push(await getVoterById(currentUserId));
        }
      }
    }

    await slack.client.views.update({
      view_id: view.id,
      view: getWishlistModal({ items, currentUserId }),
    });
  },
  async (request) => {
    const payload = request.payload;

    const currentUserId = payload.user.id;
    const action = payload.actions[0] as ButtonAction;
    const voted = action.value == "true";

    const items = await queryWishlistItems();

    // Find the item that the user voted on.
    let selectedItem = items.find((i) => i.id == action.block_id);

    if (selectedItem == null) {
      throw Error(
        `Cannot find selected wishlist item with id ${action.block_id}`
      );
    }

    if (voted) {
      selectedItem.voters = selectedItem.voters.filter((v) => v.userId != currentUserId);
    } else {
      selectedItem.voters.push(await getVoterById(currentUserId));
    }

    await cache.set('wishlist', items, {ex: ONE_DAY});

    await toggleWishlistVote(selectedItem, currentUserId, voted);
  }
);
