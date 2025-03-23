import { slack } from "../../../slack";
import { getScholarIdFromUserId } from "../../common/id_utils";
import { getNewIdeaModal } from "../views/new_idea_modal";
import { getIdeaFactoryModal } from "../views/idea_factory_modal";
import { queryIdeaFactoryItems } from "../data/query_items";
import { addIdea } from "../data/add_item";
import { getCategoryOptions } from "../data/get_categories";

export const newIdeaFactoryItemAction = "new_idea_factory_item";

/**
 * Opens the modal for adding a new idea when the user clicks the 'Add Idea' button.
 */
slack.action(newIdeaFactoryItemAction, async (request) => {
  const payload = request.payload;

  await slack.client.views.push({
    trigger_id: payload.trigger_id,
    view: getNewIdeaModal(await getCategoryOptions()),
  });
});

export const newIdeaFactoryItemCallback = "new_idea_factory_item";

/**
 * Creates a new database entry when the user submits the new idea modal and updates the original
 * idea factory modal with the new item.
 */
slack.viewSubmission(
  newIdeaFactoryItemCallback,
  async (_) => {},
  async (request) => {
    const payload = request.payload;
    const values = payload.view.state.values;

    const scholarId = await getScholarIdFromUserId(payload.user.id);

      const selectedOption = values.category_select.category_selection.selected_option;
      const pickedValue = selectedOption!.value;

    await addIdea({
        title: values.title.title.value!,
        pitch: values.pitch.pitch.value!,
        description: values.description.description.value ?? "",
        createdBy: scholarId,
        categoryId: pickedValue,
    });

    // TODO Optimize this to add the item locally instead of querying the whole table again.
      const [items] = await Promise.all([
          queryIdeaFactoryItems(payload.user.id)
      ]);

    await slack.client.views.update({
      view_id: payload.view.root_view_id!,
      view: getIdeaFactoryModal({ items }),
    });
  }
);
