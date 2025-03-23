import { slack } from "../../../slack";
import { getIdeaFactoryModal } from "../views/idea_factory_modal";
import { queryIdeaFactoryItems } from "../data/query_items";

export const openIdeaFactoryAction = "open_idea_factory";

/**
 * Opens the idea factory modal when the user clicks the 'Open Idea Factory' button.
 *
 * This directly shows the modal with a loading hint to be responsive to the user.
 * It then loads the data and updates the open modal.
 */
slack.action(
  openIdeaFactoryAction,
  async (_) => {},
  async (request) => {
    const payload = request.payload;

    // Show the modal with the initial loading hint.
    const view = await slack.client.views.open({
      trigger_id: payload.trigger_id,
      view: getIdeaFactoryModal({}),
    });

    console.time("Idea Factory Query");

    const items = await queryIdeaFactoryItems(payload.user.id);

    console.timeEnd("Idea Factory Query");

    // Update the modal with the actual data.
    await slack.client.views.update({
      view_id: view.view!.id,
      view: getIdeaFactoryModal({ items }),
    });
  }
);

export const viewIdeaFactoryInNotionAction = "view_idea_factory_in_notion";

/** Acknowledges when the user clicks the 'View in Notion' button. */
slack.action(viewIdeaFactoryInNotionAction, async (_) => {});
