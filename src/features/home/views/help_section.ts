import { AnyHomeTabBlock, Button } from "slack-edge";

export function getHelpSection(): AnyHomeTabBlock[] {
    return [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Help",
            }
        },
        {
            type: "context",
            elements: [{
                type: "mrkdwn",
                text: "If you need help using MyMM, please refer to the MyMM documentation on Notion or contact a member of Area Digital Innovation",
            }]
        },
        {
            type: "actions",
            elements: [
                getOpenHelpButton(),
            ],
        },
    ]
}

export function getOpenHelpButton(): Button {
    return {
        type: "button",
        text: {
            type: "plain_text",
            text: "🤔 Open Help Docs",
            emoji: true,
        },
        url: "https://www.notion.so/manageandmore/My-MM-Slack-App-10c02ddfbf4e80da95dac9b29543acfa",
    };
}