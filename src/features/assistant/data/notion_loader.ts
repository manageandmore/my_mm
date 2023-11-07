/**
 * Copied and adapted from langchain/document_loaders/notionapi
 * https://github.com/langchain-ai/langchainjs/blob/main/langchain/src/document_loaders/web/notionapi.ts
 */

import {
  APIResponseError,
  Client,
  isFullBlock,
  isFullPage,
  iteratePaginatedAPI,
  APIErrorCode,
  isNotionClientError,
  isFullDatabase,
} from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { getBlockChildren } from "notion-to-md/build/utils/notion.js";
import type {
  ListBlockChildrenResponseResults,
  MdBlock,
} from "notion-to-md/build/types";
import yaml from "js-yaml";
import { AsyncCaller } from "langchain/dist/util/async_caller";
import { BaseDocumentLoader } from "langchain/dist/document_loaders/base";
import { Document } from "langchain/dist/document";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GuardType<T> = T extends (x: any, ...rest: any) => x is infer U
  ? U
  : never;

export type GetBlockResponse = Parameters<typeof isFullBlock>[0];
export type GetPageResponse = Parameters<typeof isFullPage>[0];
export type GetDatabaseResponse = Parameters<typeof isFullDatabase>[0];

export type BlockObjectResponse = GuardType<typeof isFullBlock>;
export type PageObjectResponse = GuardType<typeof isFullPage>;
export type DatabaseObjectResponse = GuardType<typeof isFullDatabase>;

export type GetResponse =
  | GetBlockResponse
  | GetPageResponse
  | GetDatabaseResponse
  | APIResponseError;

export type PagePropertiesType = PageObjectResponse["properties"];
export type PagePropertiesValue = PagePropertiesType[keyof PagePropertiesType];

export const isPageResponse = (res: GetResponse): res is GetPageResponse =>
  !isNotionClientError(res) && res.object === "page";
export const isDatabaseResponse = (
  res: GetResponse
): res is GetDatabaseResponse =>
  !isNotionClientError(res) && res.object === "database";
export const isErrorResponse = (res: GetResponse): res is APIResponseError =>
  isNotionClientError(res);

export const isPage = (res: GetResponse): res is PageObjectResponse =>
  isPageResponse(res) && isFullPage(res);
export const isDatabase = (res: GetResponse): res is DatabaseObjectResponse =>
  isDatabaseResponse(res) && isFullDatabase(res);

/**
 * Represents the type of Notion API to load documents from. The options
 * are "database" or "page".
 */
// @deprecated `type` property is now automatically determined.
export type NotionAPIType = "database" | "page";

export type OnDocumentLoadedCallback = (
  current: number,
  total: number,
  currentTitle?: string,
  rootTitle?: string
) => void;

export type NotionAPILoaderOptions = {
  clientOptions: ConstructorParameters<typeof Client>[0];
  id: string;
  type?: NotionAPIType; // @deprecated `type` property is now automatically determined.
  callerOptions?: ConstructorParameters<typeof AsyncCaller>[0];
  onDocumentLoaded?: OnDocumentLoadedCallback;
  propertiesAsHeader?: boolean;
  loadRowsAsPages?: boolean;
  loadRecursiveChildPages?: boolean;
  checkEditTimestamps?: Map<string, string>;
};

export type LoaderStats = {
  existing: string[];
  skipped: string[];
  added: string[];
  updated: string[];
  removed: string[];
};

/**
 * A class that extends the BaseDocumentLoader class. It represents a
 * document loader for loading documents from Notion using the Notion API.
 */
export class NotionAPILoader extends BaseDocumentLoader {
  private caller: AsyncCaller;

  private notionClient: Client;

  private n2mClient: NotionToMarkdown;

  private id: string;

  private pageQueue: string[];

  private pageCompleted: string[];

  private pageQueueTotal: number;

  private documents: Document[];

  public rootTitle: string;

  private onDocumentLoaded: OnDocumentLoadedCallback;

  private propertiesAsHeader: boolean;

  private loadRowsAsPages: boolean;

  private loadRecursiveChildPages: boolean;

  private checkEditTimestamps: Map<string, string>;

  private loaderStats: LoaderStats;
  public get stats(): LoaderStats {
    return this.loaderStats;
  }

  constructor(options: NotionAPILoaderOptions) {
    super();

    if (!options.propertiesAsHeader && !options.loadRowsAsPages) {
      throw Error("Either propertiesAsHeader or loadRowsAsPages must be true");
    }

    this.caller = new AsyncCaller({
      maxConcurrency: 64,
      ...options.callerOptions,
    });
    this.notionClient = new Client({
      logger: () => {}, // Suppress Notion SDK logger
      ...options.clientOptions,
    });
    this.n2mClient = new NotionToMarkdown({
      notionClient: this.notionClient,
      config: { parseChildPages: false, convertImagesToBase64: false },
    });
    this.id = options.id;
    this.pageQueue = [];
    this.pageCompleted = [];
    this.pageQueueTotal = 0;
    this.documents = [];
    this.rootTitle = "";
    this.onDocumentLoaded = options.onDocumentLoaded ?? ((_ti, _cu) => {});
    this.propertiesAsHeader = options.propertiesAsHeader || false;
    this.loadRowsAsPages = options.loadRowsAsPages ?? true;
    this.loadRecursiveChildPages = options.loadRecursiveChildPages ?? false;
    this.checkEditTimestamps = options.checkEditTimestamps ?? new Map();
    this.loaderStats = {
      existing: Array.from(this.checkEditTimestamps.keys()),
      skipped: [],
      added: [],
      updated: [],
      removed: [],
    };
  }

  /**
   * Adds a selection of page ids to the pageQueue and removes duplicates.
   * @param items An array of string ids
   */
  private addToQueue(...items: string[]) {
    const deDuped = items.filter(
      (item) => !this.pageCompleted.concat(this.pageQueue).includes(item)
    );
    this.pageQueue.push(...deDuped);
    this.pageQueueTotal += deDuped.length;
  }

  /**
   * Parses a Notion GetResponse object (page or database) and returns a string of the title.
   * @param obj The Notion GetResponse object to parse.
   * @returns The string of the title.
   */
  private getTitle(obj: GetResponse) {
    if (isPage(obj)) {
      const titleProp = Object.values(obj.properties).find(
        (prop) => prop.type === "title"
      );
      if (titleProp) return this.getPropValue(titleProp);
    }
    if (isDatabase(obj))
      return obj.title
        .map((v) =>
          this.n2mClient.annotatePlainText(v.plain_text, v.annotations)
        )
        .join("");
    return null;
  }

  /**
   * Parses the property type and returns a string
   * @param page The Notion page property to parse.
   * @returns A string of parsed property.
   */
  private getPropValue(prop: PagePropertiesValue): string {
    switch (prop.type) {
      case "number": {
        const propNumber = prop[prop.type];
        return propNumber !== null ? propNumber.toString() : "";
      }
      case "url":
        return prop[prop.type] || "";
      case "select":
        return prop[prop.type]?.name ?? "";
      case "multi_select":
        return `[${prop[prop.type].map((v) => `"${v.name}"`).join(", ")}]`;
      case "status":
        return prop[prop.type]?.name ?? "";
      case "date":
        return `${prop[prop.type]?.start ?? ""}${
          prop[prop.type]?.end ? ` - ${prop[prop.type]?.end}` : ""
        }`;
      case "email":
        return prop[prop.type] || "";
      case "phone_number":
        return prop[prop.type] || "";
      case "checkbox":
        return prop[prop.type].toString();
      case "files":
        return `[${prop[prop.type].map((v) => `"${v.name}"`).join(", ")}]`;
      case "created_by":
        return `["${prop[prop.type].object}", "${prop[prop.type].id}"]`;
      case "created_time":
        return prop[prop.type];
      case "last_edited_by":
        return `["${prop[prop.type].object}", "${prop[prop.type].id}"]`;
      case "last_edited_time":
        return prop[prop.type];
      case "title":
        return prop[prop.type]
          .map((v) =>
            this.n2mClient.annotatePlainText(v.plain_text, v.annotations)
          )
          .join("");
      case "rich_text":
        return prop[prop.type]
          .map((v) =>
            this.n2mClient.annotatePlainText(v.plain_text, v.annotations)
          )
          .join("");
      case "people":
        return `[${prop[prop.type]
          .map((v) => `["${v.object}", "${v.id}"]`)
          .join(", ")}]`;
      case "unique_id":
        return `${prop[prop.type].prefix || ""}${prop[prop.type].number}`;
      case "relation":
        return `[${prop[prop.type].map((v) => `"${v.id}"`).join(", ")}]`;
      case "rollup":
        switch (prop.rollup.type) {
          case "number":
            return prop.rollup.number?.toString() || "";
          case "array":
            return `[${prop.rollup.array
              .map((item) => this.getPropValue(item as PagePropertiesValue))
              .join(", ")}]`;
          default:
            return `Unsupported rollup type: ${prop.rollup.type}`;
        }
      default:
        return `Unsupported type: ${prop.type}`;
    }
  }

  /**
   * Parses the properties of a Notion page and returns them as key-value
   * pairs.
   * @param page The Notion page to parse.
   * @returns An object containing the parsed properties as key-value pairs.
   */
  private parsePageProperties(
    page: PageObjectResponse | DatabaseObjectResponse
  ) {
    return Object.entries(page.properties).reduce((accum, [propName, prop]) => {
      const value = this.getPropValue(prop);
      const props = { ...accum, [propName]: value };
      return prop.type === "title" ? { ...props, _title: value } : props;
    }, {} as { [key: string]: string });
  }

  /**
   * Parses the details of a Notion page and returns them as an object.
   * @param page The Notion page to parse.
   * @returns An object containing the parsed details of the page.
   */
  private parsePageDetails(page: PageObjectResponse, targetId: string) {
    const { id, ...rest } = page;
    return {
      ...rest,
      title: this.getTitle(page),
      notionId: id,
      targetId,
      properties: this.parsePageProperties(page),
    };
  }

  private parseDatabaseDetails(database: DatabaseObjectResponse) {
    const { id, ...rest } = database;
    return {
      ...rest,
      title: this.getTitle(database),
      notionId: id,
      targetId: id,
    };
  }

  /**
   * Loads a Notion block and returns it as an MdBlock object.
   * @param block The Notion block to load.
   * @returns A Promise that resolves to an MdBlock object.
   */
  private async loadBlock(block: BlockObjectResponse): Promise<MdBlock> {
    const mdBlock: MdBlock = {
      type: block.type,
      blockId: block.id,
      parent: await this.caller.call(() =>
        this.n2mClient.blockToMarkdown(block)
      ),
      children: [],
    };

    if (block.has_children) {
      const block_id =
        block.type === "synced_block" &&
        block.synced_block?.synced_from?.block_id
          ? block.synced_block.synced_from.block_id
          : block.id;

      const childBlocks = await this.loadBlocks(
        await this.caller.call(() =>
          getBlockChildren(this.notionClient, block_id, null)
        )
      );

      mdBlock.children = childBlocks;
    }

    return mdBlock;
  }

  /**
   * Loads Notion blocks and their children recursively.
   * @param blocksResponse The response from the Notion API containing the blocks to load.
   * @returns A Promise that resolves to an array containing the loaded MdBlocks.
   */
  private async loadBlocks(
    blocksResponse: ListBlockChildrenResponseResults
  ): Promise<MdBlock[]> {
    const blocks = blocksResponse.filter(isFullBlock);

    // Add child pages to queue
    const childPages = this.loadRecursiveChildPages
      ? blocks
          .filter((block) => block.type.includes("child_page"))
          .map((block) => block.id)
      : [];
    if (childPages.length > 0) this.addToQueue(...childPages);

    // Add child database pages to queue
    const childDatabases = this.loadRecursiveChildPages
      ? blocks
          .filter((block) => block.type.includes("child_database"))
          .map((block) =>
            this.caller.call(() => this.loadDatabaseEntries(block.id))
          )
      : [];

    // Load this block and child blocks
    const loadingMdBlocks = blocks
      .filter((block) => !["child_page", "child_database"].includes(block.type))
      .map((block) => this.loadBlock(block));

    const [mdBlocks] = await Promise.all([
      Promise.all(loadingMdBlocks),
      Promise.all(childDatabases),
    ]);

    return mdBlocks;
  }

  private checkNotEdited(pageId: string, lastEditedTime: string): boolean {
    let lastEditTimestamp = this.checkEditTimestamps.get(pageId);
    if (lastEditTimestamp != null) {
      if (Date.parse(lastEditTimestamp) >= Date.parse(lastEditedTime)) {
        this.loaderStats.skipped.push(pageId);
        this.pageCompleted.push(pageId);
        return true;
      } else {
        this.loaderStats.updated.push(pageId);
      }
    } else {
      this.loaderStats.added.push(pageId);
    }
    return false;
  }

  /**
   * Loads a Notion page and its child documents, then adds it to the completed documents array.
   * @param page The Notion page or page ID to load.
   */
  private async loadPage(page: string | PageObjectResponse) {
    // Check page is a page ID or a PageObjectResponse
    const [pageData, pageId] =
      typeof page === "string"
        ? [
            this.caller.call(() =>
              this.notionClient.pages.retrieve({ page_id: page })
            ),
            page,
          ]
        : [page, page.id];

    const [pageDetails, pageBlocks] = await Promise.all([
      pageData,
      this.caller.call(() => getBlockChildren(this.notionClient, pageId, null)),
    ]);

    if (!isFullPage(pageDetails)) {
      this.pageCompleted.push(pageId);
      return;
    }

    if (this.checkNotEdited(pageId, pageDetails.last_edited_time)) {
      return;
    }

    const mdBlocks = await this.loadBlocks(pageBlocks);
    const mdStringObject = this.n2mClient.toMarkdownString(mdBlocks);

    let pageContent = mdStringObject.parent;
    const metadata = this.parsePageDetails(pageDetails, pageId);

    if (this.propertiesAsHeader) {
      pageContent =
        `---\n` +
        `${yaml.dump(metadata.properties)}` +
        `---\n\n` +
        `${pageContent ?? ""}`;
    }

    const pageDocument = new Document({ pageContent, metadata });

    this.documents.push(pageDocument);
    this.pageCompleted.push(pageId);
    this.onDocumentLoaded(
      this.documents.length,
      this.pageQueueTotal,
      this.getTitle(pageDetails) || undefined,
      this.rootTitle
    );
  }

  /**
   * Loads a Notion database object, then adds it to the completed documents array.
   * @param page The Notion database object.
   */
  private async loadDatabaseEntry(page: PageObjectResponse) {
    const pageId = page.id;

    if (this.checkNotEdited(pageId, page.last_edited_time)) {
      return;
    }

    let pageContent = "";
    const metadata = this.parsePageDetails(page, this.id);

    if (this.propertiesAsHeader) {
      pageContent = `---\n` + `${yaml.dump(metadata.properties)}` + `---`;
    }

    const pageDocument = new Document({ pageContent, metadata });

    this.documents.push(pageDocument);
    this.pageCompleted.push(pageId);
    this.onDocumentLoaded(
      this.documents.length,
      this.pageQueueTotal,
      this.getTitle(page) || undefined,
      this.rootTitle
    );
  }

  /**
   * Loads a Notion database and adds it's pages to the queue.
   * @param id The ID of the Notion database to load.
   */
  private async loadDatabaseEntries(id: string) {
    try {
      for await (const page of iteratePaginatedAPI(
        this.notionClient.databases.query,
        {
          database_id: id,
          page_size: 50,
        }
      )) {
        if (this.loadRowsAsPages) {
          this.addToQueue(page.id);
        } else if (isPage(page)) {
          await this.loadDatabaseEntry(page);
        }
      }
    } catch (e) {
      console.log(e);
      // TODO: Catch and report api request errors
    }
  }

  /**
   * Loads a Notion database and adds it's pages to the queue.
   * @param id The ID of the Notion database to load.
   */
  private async loadDatabase(database: DatabaseObjectResponse) {
    const dbId = database.id;

    if (this.checkNotEdited(dbId, database.last_edited_time)) {
      return;
    }

    let pageContent = database.description
      .map((v) => this.n2mClient.annotatePlainText(v.plain_text, v.annotations))
      .join("");
    const metadata = this.parseDatabaseDetails(database);

    const dbDocument = new Document({ pageContent, metadata });

    this.documents.push(dbDocument);
    this.pageCompleted.push(dbId);
    this.onDocumentLoaded(
      this.documents.length,
      this.pageQueueTotal,
      this.getTitle(database) || undefined,
      this.rootTitle
    );
  }

  /**
   * Loads the documents from Notion based on the specified options.
   * @returns A Promise that resolves to an array of Documents.
   */
  async load(): Promise<Document[]> {
    const resPagePromise = this.notionClient.pages
      .retrieve({ page_id: this.id })
      .then((res) => {
        this.addToQueue(this.id);
        return res;
      })
      .catch((error: APIResponseError) => error);

    const resDatabasePromise = this.notionClient.databases
      .retrieve({ database_id: this.id })
      .then(async (res) => {
        await this.loadDatabase(res as DatabaseObjectResponse);
        await this.loadDatabaseEntries(this.id);
        return res;
      })
      .catch((error: APIResponseError) => error);

    const [resPage, resDatabase] = await Promise.all([
      resPagePromise,
      resDatabasePromise,
    ]);

    // Check if both resPage and resDatabase resulted in error responses
    const errors = [resPage, resDatabase].filter(isErrorResponse);
    if (errors.length === 2) {
      if (errors.every((e) => e.code === APIErrorCode.ObjectNotFound)) {
        throw new AggregateError([
          Error(
            `Could not find object with ID: ${this.id}. Make sure the relevant pages and databases are shared with your integration.`
          ),
          ...errors,
        ]);
      }
      throw new AggregateError(errors);
    }

    this.rootTitle =
      this.getTitle(resPage) || this.getTitle(resDatabase) || this.id;

    let pageId = this.pageQueue.shift();
    while (pageId) {
      await this.loadPage(pageId);
      pageId = this.pageQueue.shift();
    }

    this.loaderStats.removed = this.loaderStats.existing.filter(
      (id) =>
        !this.loaderStats.updated.includes(id) &&
        !this.loaderStats.skipped.includes(id)
    );

    return this.documents;
  }
}
