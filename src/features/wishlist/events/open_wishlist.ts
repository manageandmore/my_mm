import { slack } from "../../../slack";
import { getWishlistModal } from "../modals/wishlist";
import { queryWishlistItems } from "../data/query_items";

export const openWishlistAction = "open_wishlist";

/**
 * Opens the wishlist modal when the user clicks the 'Open Wishlist' button.
 *
 * This directly shows the modal with a loading hint to be responsive to the user.
 * It then loads the data and updates the open modal.
 */
slack.action(
  openWishlistAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload;

    // Show the modal with the initial loading hint.
    const view = await slack.client.views.open({
      trigger_id: payload.trigger_id,
      view: getWishlistModal({}),
    });

    console.time("Wishlist Query");

    var items = await queryWishlistItems(payload.user.id);

    console.timeEnd("Wishlist Query");

    // Update the modal with the actual data.
    await slack.client.views.update({
      view_id: view.view!.id,
      view: getWishlistModal({ items }),
    });
  }
);

export const viewWishlistInNotionAction = "view_wishlist_in_notion";

/** Acknowledges when the user clicks the 'View in Notion' button. */
slack.action(viewWishlistInNotionAction, async (_) => {});
