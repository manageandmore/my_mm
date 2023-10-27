import { slack } from "../../slack"

slack.globalShortcut('create_event', async (request) => {
  const shortcut = request.payload
  
  // await app.client.views.open({
  //   trigger_id: shortcut.trigger_id,
  //   view: getEventModal({})
  // })

  return {
    status: 200,
    body: {
      response_type: 'ephemeral',
      text: 'Oh yeah'
    }
  }
})

slack.viewSubmission('event-modal', async (request) => {

  const submission = request.payload

  const values = submission.view.state.values

  return {
    status: 200,
    body: {
      response_action: "clear"
    }
  }
})
