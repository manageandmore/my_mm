import { queryWishlistItems, wishlistDatabaseId, WishlistItem } from "./query"
import { slack } from "../../slack"
import { getWishlistModal } from "./modals/wishlist"
import { ButtonAction } from "slack-edge"
import { getVoterById } from "./voter"
import { notion } from "../../notion"
import { queryScholarProfile } from "../profile/query"
import { getScholarIdFromUserId } from "../common/id_utils"
import { getNewItemModal } from "./modals/new_item"

slack.action(
  'open_wishlist', 
  async (request) => {}, 
  async (request) => {
    const payload = request.payload

    const view = await slack.client.views.open({
      trigger_id: payload.trigger_id,
      view: getWishlistModal({})
    })

    console.time('Wishlist Query')

    var items = await queryWishlistItems(payload.user.id)

    console.timeEnd('Wishlist Query')

    await slack.client.views.update({
      view_id: view.view!.id,
      view: getWishlistModal({items})
    })
  },
)

slack.action(
  'vote_wishlist_item', 
  async (request) => {
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
  },
  async (request) => {
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
      relations = currentItem!.voters.filter((v) => v.id != payload.user.id).map((v) => ({id: v.scholarId}))
    } else {
      let scholarId = await getScholarIdFromUserId(payload.user.id)
      relations = [...currentItem!.voters.map((v) => ({id: v.scholarId})), {id: scholarId}]
    }

    notion.pages.update({
      page_id: action.block_id,
      properties: {
        Voted: {
          relation: relations
        }
      }
    })
  },
)

slack.action(
  'new_wishlist_item',
  async (request) => {
    const payload = request.payload

    await slack.client.views.push({
      trigger_id: payload.trigger_id,
      view: getNewItemModal()
    })
  }
)

slack.viewSubmission(
  'new_wishlist_item', 
  async (request) => {},
  async (request) => {
    
    const payload = request.payload

    const title = payload.view.state.values.title.title.value!
    const description = payload.view.state.values.description.description.value!

    const scholarId = await getScholarIdFromUserId(payload.user.id)

    await notion.pages.create({
      parent: {
        type: 'database_id',
        database_id: wishlistDatabaseId
      },
      properties: {
        Title: {
          type: 'title',
          title: [{type: 'text', text: {content: title}}]
        },
        Description: {
          type: 'rich_text',
          rich_text: [{type: 'text', text: {content: description}}]
        },
        Voted: {
          type: 'relation',
          relation: [{id: scholarId}]
        }
      }
    })

    var items = await queryWishlistItems(payload.user.id)

    await slack.client.views.update({
      view_id: payload.view.root_view_id!,
      view: getWishlistModal({items})
    })
  }
)