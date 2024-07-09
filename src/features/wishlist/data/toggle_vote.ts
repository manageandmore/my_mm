import { notion } from "../../../notion";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { WishlistItem } from "./query_items";

export async function toggleWishlistVote( item: WishlistItem,  userId: string, voted: boolean) {
  var relations: { id: string }[] = [];

  if (voted) {
    // Remove the current user from the list of voters and map it to the scholar relations for notion.
    relations = item.voters
      .filter((v) => v.userId != userId)
      .map((v) => ({ id: v.scholarId }));
  } else {
    // Add the current user to the list of voters and map it to the scholar relations for notion.
    let scholarId = await getScholarIdFromUserId(userId);
    relations = [
      ...item.voters.map((v) => ({ id: v.scholarId })),
      { id: scholarId },
    ];
  }

  // Update the Voted property of the wishlist item in notion.
  await notion.pages.update({
    page_id: item.id,
    properties: {
      Voted: {
        relation: relations,
      },
    },
  });
}