// Define a type for the formatted option
import {notion} from "../../../notion";
import {ideaFactoryDatabaseId} from "./query_items";

export type IdeaCategory = {
    text: string;
    value: string;
};

export async function getCategoryOptions(): Promise<IdeaCategory[]> {
    try {
        const database = await notion.databases.retrieve({
            database_id: ideaFactoryDatabaseId,
        });

        // Type assertion for the property since the Notion API response can be loosely typed
        const categoryProperty = (database.properties as Record<string, any>)["Category"];

        if (!categoryProperty || categoryProperty.type !== "select") {
            throw new Error("Category property not found or is not a select type.");
        }

        const options = categoryProperty.select.options;

        // Map options to a format that can be directly used in a static_select Slack modal
        return options.map((option: any) => ({
            text: option.name,
            value: option.id,
        }));
    } catch (error) {
        console.error("Error retrieving Category options:", error);
        throw error;
    }
}
