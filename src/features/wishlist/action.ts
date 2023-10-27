import { queryWishlistItems } from "./query"
import { slack } from "../../slack"
import { getWishlistModal } from "./modal"

slack.action('open_wishlist', async (request) => {}, async (request) => {
  const action = request.payload

  const view = await slack.client.views.open({
    trigger_id: action.trigger_id,
    view: getWishlistModal({})
  })

  var items = await queryWishlistItems()

  await slack.client.views.update({
    view_id: view.view!.id,
    view: getWishlistModal({items})
  })
})