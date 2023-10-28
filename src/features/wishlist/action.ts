import { queryWishlistItems, wishlistDatabaseId, WishlistItem } from "./query"
import { slack } from "../../slack"
import { getWishlistModal } from "./modal"
import { ButtonAction } from "slack-edge"
import { getVoterById } from "./voter"
import { notion } from "../../notion"
import { queryUserProfile } from "../profile/query"
import { getEmailForUser } from "../profile/user"

slack.action('open_wishlist', async (request) => {}, async (request) => {
  const action = request.payload

  const view = await slack.client.views.open({
    trigger_id: action.trigger_id,
    view: getWishlistModal({})
  })

  var items = await queryWishlistItems(action.user.id)

  await slack.client.views.update({
    view_id: view.view!.id,
    view: getWishlistModal({items})
  })
})

slack.action('vote_wishlist_item', async (request) => {
  const payload = request.payload
  
  const action = payload.actions[0] as ButtonAction

  var view = payload.view!
  const items = JSON.parse(view.private_metadata) as WishlistItem[]

  for (var item of items) {
    if (item.id == action.block_id) {
      item.votedByUser = !item.votedByUser
      if (item.votedByUser) {
        item.voters.push(await getVoterById(payload.user.id))
      } else {
        item.voters = item.voters.filter((v) => v.id != payload.user.id)
      }
    }
  }

  await slack.client.views.update({
    view_id: view.id,
    view: getWishlistModal({items})
  })
}, async (request) => {
  
  const payload = request.payload
  
  const action = payload.actions[0] as ButtonAction
  const voted = action.value == 'true'

  const view = payload.view!
  const items = JSON.parse(view.private_metadata) as WishlistItem[]
  let currentItem: WishlistItem

  for (let item of items) {
    if (item.id == action.block_id) {
      currentItem = item
    }
  }

  var relations: {id: string}[] = []

  if (voted) {
    relations = currentItem!.voters.filter((v) => v.id != payload.user.id).map((v) => ({id: v.notionId}))
  } else {
    let email = await getEmailForUser(payload.user.id)
    let profile = await queryUserProfile(email!)
    relations = [...currentItem!.voters.map((v) => ({id: v.notionId})), {id: profile.id!}]
  }

  notion.pages.update({
    page_id: action.block_id,
    properties: {
      Voted: {
        relation: relations
      }
    }
  })
})