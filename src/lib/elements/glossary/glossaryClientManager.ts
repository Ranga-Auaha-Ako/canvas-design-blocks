import escapeStringRegexp from "escape-string-regexp";
import Term from "./clientside/term.svelte";
import DefinitionList from "./clientside/definitionList.svelte";
import { courseEnv } from "$lib/util/courseEnv";
import Cookie from "js-cookie";
import { persisted } from "svelte-persisted-store";
import { Glossary, termDefinition } from "./pageParser";
import { GlossaryStates, getRichGlossary, glossaryState } from "./pageInfo";

const CSRF = Cookie.get("_csrf_token");

// The name of the glossary page *should* be "cdb-glossary", but it's possible that it's different. Deleting the page will cause any new glossary to be created with names like "cdb-glossary-1", as the name is based on the title of the page. This is a problem because the glossary editor will only look for a page with the exact name "cdb-glossary". To fix this, we need to get the glossary page by its title, and then use the id to fetch the page contents.

export const GLOSSARY_ENABLED = persisted("cdb-glossary-enabled", true);

export type glossaryState = {
  terms: termDefinition[];
  institutionDefaults: boolean;
};

/**
 * Manages the client-side functionality for the glossary.
 */
export class GlossaryClientManager {
  public terms: termDefinition[] = [];
  public institutionDefaults: boolean = false;
  public termNodes: HTMLSpanElement[] = [];
  public glossary: Glossary | undefined;

  getTermRegex() {
    if (!this.glossary?.hasTerms) return new RegExp("$^", "ig");

    // Compile terms once, sorted by length
    const terms = this.glossary.allTerms
        .sort((a, b) => b.term.length - a.term.length)
        .map(t => t.term.trim())
        .filter(Boolean); // Remove empty terms

    return new RegExp(
        "(?<![\\p{L}\\p{N}\\p{M}])" +  // Positive lookbehind for non-word char, not using \\b as it is unicode-unaware
        "(" +
        terms
            .map(term => term.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'))
            .join("|") +
        ")" +
        "(?![\\p{L}\\p{N}\\p{M}])",    // Positive lookahead for non-word char (not letters/numbers/marks)
        "igud"  // Flags: 'i'-case insensitive; 'g'- global matching, match all occurrences; 'u'- treats pattern as Unicode; 'd'- return start/end indices of matches alongside matched text
    );
  }

  constructor() {
    // super(GlossaryState, Glossary, ".CDB--Glossary[data-cdb-version]");
  }

  private termWalker(root: HTMLElement) {
    const regex = this.getTermRegex();

    // Tags that should not have their text content processed
    const InteractiveTags = new Set([
      "A", "BUTTON", "TEXTAREA", "INPUT", "IFRAME",
      "DETAILS", "DIALOG", "SELECT", "SCRIPT", "STYLE",
      "CODE", "PRE"
    ]);

    // Classes that should be excluded from processing
    const ExcludedClasses = new Set([
      "CDB--Icon",
      "DesignBlocks--Icon",
      "cdb--icon",
      "safeBackground",
      "iconPlaceholder"
    ]);

    return document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,  // Only show text nodes
      {
        acceptNode(node) {
          // Skip empty text nodes
          const text = node.textContent?.normalize("NFC")?.trim();
          if (!text) {
            return NodeFilter.FILTER_REJECT;
          }

          // Walk up the DOM tree to check for excluded elements
          let currentElement = node.parentElement;
          while (currentElement) {
            // Skip if any parent has excluded class
            if ([...ExcludedClasses].some(cls =>
              currentElement?.classList.contains(cls))) {
              return NodeFilter.FILTER_REJECT;
            }

            // Skip if any parent is an interactive element
            if (InteractiveTags.has(currentElement.tagName)) {
              return NodeFilter.FILTER_REJECT;
            }

            // Check next parent
            currentElement = currentElement.parentElement;
          }

          // Reset regex lastIndex
          regex.lastIndex = 0;

          // Only accept nodes that contain glossary terms
          return regex.test(text)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );
  }

  private addGlossaryTags(node: Text) {
      const regex = this.getTermRegex();
      let text = node.textContent?.normalize("NFC") || "";
      let currentNode = node;
      let foundTermNodes = [];

      // Reset regex state
      regex.lastIndex = 0;

      let match;
      while ((match = regex.exec(text)) !== null) {
          // Create a new text node for the content before the match
          const before = currentNode.splitText(match.index);

          // Create a new text node for the content after the match
          currentNode = before.splitText(match[0].length);

          // Create the span for the matched term
          const span = document.createElement("span");
          span.classList.add("CDB--Glossary");
          span.dataset.cdbTerm = match[1];  // Use the captured group
          span.textContent = match[1];

          // Replace the matched text with the span
          before.replaceWith(span);

          foundTermNodes.push(span);
          this.termNodes.push(span);

          // Update text and position for next iteration
          text = currentNode.textContent || "";
          regex.lastIndex = 0;  // Reset regex state
      }

      return foundTermNodes;
  }

  public onEditorPage = false;

  /**
   * Renders the client component for the glossary.
   *
   * @param force - A boolean indicating whether to force the rendering even if the page is not fully loaded.
   * @returns A Promise that resolves once the client component is rendered.
   */
  async renderClientComponent(force: boolean = false) {
    if (import.meta.env.MODE.includes("mobile")) {
      // For now, the mobile app is not suported.
      return;
    }
    if (!force && document.readyState !== "complete") {
      // Come back when the page is fully loaded
      window.addEventListener("load", () => this.renderClientComponent(true));
      return;
    }

    const state = await glossaryState;
    // If we're on the glossary page, render the viewer or editor
    if (
      state.state !== GlossaryStates.NO_GLOSSARY &&
      courseEnv?.WIKI_PAGE &&
      courseEnv?.WIKI_PAGE.url &&
      (state.state === GlossaryStates.GLOSSARY_UNLINKED
        ? state.page_matches.some(
            (page) => page.url === courseEnv.WIKI_PAGE?.url
          )
        : courseEnv?.WIKI_PAGE?.url === state.url)
    ) {
      const contents = courseEnv.WIKI_PAGE.body;
      const glossary = Glossary.fromHTML({
        state: GlossaryStates.GLOSSARY_LINKED,
        html: contents,
        url: courseEnv.WIKI_PAGE.url,
        title: courseEnv.WIKI_PAGE.title,
      });
      const container = document.getElementById("content");
      if (!container) return;
      document.body.classList.add("cdb-glossary-editor-active");
      const { GlossaryEditor, GlossaryViewer } = await import(
        "./glossaryLoader"
      );
      if (document.location.pathname.endsWith("/edit")) {
        this.onEditorPage = true;
        new GlossaryEditor({
          target: container,
          props: {
            glossaryData: glossary,
          },
          intro: true,
        });
      } else {
        new GlossaryViewer({
          target: container,
          props: {
            glossaryData: glossary,
          },
          intro: true,
        });
      }
      return;
    }
    const glossaryEls = document.querySelectorAll<HTMLDivElement>(
      import.meta.env.MODE.includes("mobile")
        ? "#content"
        : "div#wiki_page_show .user_content"
    );
    if (glossaryEls.length === 0) return;
    if (state.state !== GlossaryStates.GLOSSARY_LINKED) return;
    const richState = await getRichGlossary(state);
    this.glossary = Glossary.fromHTML(richState);
    // If there are no terms, return
    if (!this.glossary.hasTerms) return;
    // Add glossary tags to the page
    glossaryEls.forEach((el) => {
      const iterator = this.termWalker(el);
      let results = [];
      let foundTermNodes: HTMLElement[] = [];
      while (iterator.nextNode()) {
        results.push(iterator.currentNode);
      }
      results.forEach((node) => {
        foundTermNodes.push(...this.addGlossaryTags(node as Text));
      });
      new DefinitionList({
        target: el,
        props: {
          terms: this.glossary!.allTerms,
          termNodes: foundTermNodes,
        },
      });
    });
    // Render the glossary component
    this.termNodes.forEach((termNode) => {
      const term = termNode.dataset.cdbTerm;
      if (!term) return;
      const definition = this.glossary!.allTerms.find(
        (t) => t.term.toLowerCase() === term.toLowerCase()
      )?.definition;
      if (!definition) return;
      termNode.innerHTML = "";
      new Term({
        target: termNode,
        props: {
          term,
          definition,
        },
      });
    });
  }
}

export default new GlossaryClientManager();
