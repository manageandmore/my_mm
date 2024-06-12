import { ModalView } from "slack-edge";

export type ContentSchedulerModalOptions = {
  previewImageUrl: string;
  imageUrl: string;
};

//TODO: Define Interface
//TODO: Remove Events.

/**
 * Constructs the modal view for the inbox viewer
 *
 * @param options The options for hydrating the modal.
 * @returns The modal view.
 */
export function getInboxSection(): any {

  return (
    [
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": ":newspaper:  Your MM Inbox  :newspaper:"
			}
		},
		{
			"type": "divider"
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": " :loud_sound: *ACTION REQUIRED* :loud_sound:"
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "Unlock the Power of AI with Our Microclasses!  Join us for a series of transformative microclasses designed to supercharge your skills in Artificial Intelligence (AI)...."
			},
			"accessory": {
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "Go to post",
					"emoji": true
				}
			}
		},
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "Done"
					},
					"style": "primary",
					"value": "click_me_123"
				},
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "Ignore"
					},
					"style": "danger",
					"value": "click_me_123"
				}
			]
		},
		{
			"type": "divider"
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": ":calendar: |   *UPCOMING EVENTS*  | :calendar: "
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "`11/20-11/22` *Beet the Competition* _ annual retreat at Schrute Farms_"
			},
			"accessory": {
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "RSVP",
					"emoji": true
				}
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "`12/01` *Toby's Going Away Party* at _Benihana_"
			},
			"accessory": {
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "Learn More",
					"emoji": true
				}
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "`11/13` :pretzel: *Pretzel Day* :pretzel: at _Scranton Office_"
			},
			"accessory": {
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "RSVP",
					"emoji": true
				}
			}
		},
		{
			"type": "divider"
		},
		{
			"type": "context",
			"elements": [
				{
					"type": "mrkdwn",
					"text": ":pushpin: Do you have something to include in the newsletter? Here's *how to submit content*."
				}
			]
		}
])
}

