import { slack } from "../../../slack";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { getNewSuggestionModal } from "../modals/new_suggestion";
import { getWishlistModal } from "../modals/wishlist";
import { queryWishlistItems } from "../data/query_items";
import { addWishlistItem } from "../data/add_item";

export const newWishlistItemAction = "new_wishlist_item";

/**
 * Opens a the modal for adding a new suggestion when the user clicks the 'Add Suggestion' button.
 */
slack.action(newWishlistItemAction, async (request) => {
  const payload = request.payload;

  await slack.client.views.push({
    trigger_id: payload.trigger_id,
    view: getNewSuggestionModal(),
  });
});

export const newWishlistItemCallback = "new_wishlist_item";

/**
 * Creates a new database entry when the user submits the new suggestion modal and updates the original
 * wishlist modal with the new item.
 */
slack.viewSubmission(
  newWishlistItemCallback,
  async (_) => {},
  async (request) => {
    const payload = request.payload;
    const values = payload.view.state.values;

    const scholarId = await getScholarIdFromUserId(payload.user.id);

    await addWishlistItem({
      title: values.title.title.value!,
      description: values.description.description.value!,
      createdBy: scholarId,
    });

    // TODO Optimize this to add the item locally instead of querying the whole table again.
    var items = await queryWishlistItems(payload.user.id);

    await slack.client.views.update({
      view_id: payload.view.root_view_id!,
      view: getWishlistModal({ items }),
    });
  }
);
