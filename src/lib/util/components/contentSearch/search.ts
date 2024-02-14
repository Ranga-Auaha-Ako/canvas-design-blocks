import {
  Readable,
  Writable,
  derived,
  get,
  readable,
  writable,
} from "svelte/store";

export enum InternalLinks {
  Pages = "Pages",
  Assignments = "Assignments",
  Quizzes = "Quizzes",
  Announcements = "Announcements",
  Discussions = "Discussions",
  Modules = "Modules",
  Navigation = "Course navigation",
  File = "File",
}

export enum FitlerTypes {
  Images = "images",
  All = "all",
}

export interface Link {
  name: string;
  url: string;
  type?: InternalLinks;
  published?: boolean;
}

export interface File extends Link {
  size: number;
  display_name: string;
}
export interface Image extends File {
  image: string;
  created_at: string;
  thumbnail_url: string;
}

const COURSE_ID = window.ENV?.COURSE_ID;

class MockSearch<L = Link> {
  public readonly data;
  public readonly total;
  public readonly links = readable<
    Promise<{
      current?: string;
      prev?: string;
      first?: string;
      last?: string;
    }>
  >(new Promise((set) => set({})));
  public page: Writable<number> = writable(1);
  public perPage: Writable<number> = writable(12);
  public query: Writable<string> = writable("");
  constructor(data: L[] | PromiseLike<L[]> = []) {
    this.data = readable(Promise.resolve(data));
    this.total = derived(this.data, ($data, set) => {
      $data.then((d) => set(d.length));
    });
  }
}

export const mockData = import.meta.env.PROD
  ? new MockSearch<Image>([])
  : new MockSearch<Image>(import("./mock").then((d) => d.default) as any);

abstract class ContentSearch<L = Link> implements MockSearch<L> {
  abstract urlBase: string | undefined;
  public page = writable(1);
  public perPage = writable(12);
  public query = writable("");
  public readonly url = derived(
    [this.page, this.perPage, this.query],
    ([$page, $perPage, $query]) => {
      if (!this.urlBase) return "";
      const u = new URL(this.urlBase, document.URL);
      if ($query) {
        u.searchParams.set("search_term", $query);
      }
      if (!isNaN($perPage)) {
        u.searchParams.set("page", String($page));
        u.searchParams.set("per_page", String($perPage));
      }
      return u.toString();
    }
  );
  public readonly _state = derived(this.url, ($url) => {
    return new Promise<
      ReturnType<(typeof ContentSearch)["parseLinkHeader"]> & { data: L[] }
    >((set) => {
      if (!this.urlBase)
        return new Promise((set) => set({ links: {}, data: [] }));
      fetch($url)
        .then(async (response) => {
          const json = (await response.json()) as Record<string, any>[];
          const links = ContentSearch.parseLinkHeader(
            response.headers.get("Link") || "",
            json
          );
          set({
            data: await this.getLinks(json),
            ...links,
          });
        })
        .catch(() => {
          set({ links: {}, data: [], total: 0 });
        });
    });
  });
  public readonly data = derived(this._state, ($state) =>
    $state.then((s) => s.data)
  );
  public readonly links = derived(this._state, ($state) =>
    $state.then((s) => s.links)
  );
  public readonly total = derived(this._state, ($state) =>
    $state.then((s) => s.total || s.data.length)
  );
  abstract getLinks(data: Record<string, any>[]): Promise<L[]>;
  static parseLinkHeader(link: string, results: Record<string, any>[]) {
    const links = link.split(",");
    const parsedLinks: {
      current?: string;
      prev?: string;
      first?: string;
      last?: string;
    } = {};
    links.forEach((link) => {
      type linkRels = keyof typeof parsedLinks;
      const match = link.match(/<([^>]+)>; rel="([^"]+)"/);
      if (match) {
        parsedLinks[match[2] as linkRels] = match[1];
      }
    });
    let total = results.length;
    if (parsedLinks.last) {
      const last = parsedLinks.last.split("?");
      if (last[1]) {
        const lastParams = new URLSearchParams(last[1]);
        const lastPage = lastParams.get("page");
        const perPage = lastParams.get("per_page");
        if (lastPage && perPage) {
          total = Number(lastPage) * Number(perPage);
        }
      }
    }
    return {
      links: parsedLinks,
      total,
    };
  }
  constructor(protected _query = "", _page = 1, _perPage = 12) {
    if (_query) this.query.set(_query);
    if (_page !== 1) this.page.set(_page);
    if (_perPage !== 12) this.perPage.set(_perPage);
  }
}

export class FileSearch<F extends FitlerTypes> extends ContentSearch<
  F extends FitlerTypes.Images ? Image : File
> {
  get urlBase() {
    return `/api/v1/courses/${COURSE_ID}/files?${
      this.filter === FitlerTypes.Images ? "content_types=image&" : ""
    }sort=created_at&order=desc`;
  }
  constructor(
    query?: string,
    public filter: F = FitlerTypes.All as F,
    page?: number,
    perPage?: number
  ) {
    super(query, page, perPage);
  }
  async getLinks(data: Record<string, any>[]) {
    return data.map<F extends FitlerTypes.Images ? Image : File>((f) => {
      let file: any = {
        name: f.display_name,
        display_name: f.display_name,
        size: f.size,
        url: f.url,
        type: InternalLinks.File,
        published: f.published,
      } as File;
      if (this.filter === FitlerTypes.Images) {
        file.image = getImageUrl(f);
        file.thumbnail_url = f.thumbnail_url;
        file.created_at = f.created_at;
      }
      return file;
    });
  }
}

export class DiscussionSearch extends ContentSearch<Link> {
  urlBase = `/api/v1/courses/${COURSE_ID}/discussion_topics`;
  async getLinks(data: Record<string, any>[]) {
    return data.map<Link>((a) => {
      return {
        name: a.title,
        url: a.html_url,
        type: InternalLinks.Discussions,
        published: a.published,
      };
    });
  }
}

export class AnnouncementSearch extends DiscussionSearch {
  urlBase = `/api/v1/courses/${COURSE_ID}/discussion_topics?only_announcements=true`;
}

export class AssignmentSearch extends ContentSearch<Link> {
  urlBase = `/api/v1/courses/${COURSE_ID}/assignments`;
  async getLinks(data: Record<string, any>[]) {
    return data.map<Link>((a) => {
      return {
        name: a.name,
        url: a.html_url,
        type: InternalLinks.Assignments,
        published: a.published,
      };
    });
  }
}

export class OldQuizSearch extends ContentSearch<Link> {
  urlBase = `/api/v1/courses/${COURSE_ID}/quizzes`;
  async getLinks(data: Record<string, any>[]) {
    return data.map<Link>((q) => {
      return {
        name: q.title,
        url: q.html_url,
        type: InternalLinks.Quizzes,
        published: q.published,
      };
    });
  }
}

export class NewQuizSearch extends ContentSearch<Link> {
  urlBase = `/api/quiz/v1/courses/${COURSE_ID}/quizzes`;
  async getLinks(data: Record<string, any>[]) {
    return data.map<Link>((q) => {
      return {
        name: q.title,
        url: q.html_url,
        type: InternalLinks.Quizzes,
        published: q.published,
      };
    });
  }
}

export class QuizSearch implements MockSearch<Link> {
  urlBase = undefined;
  oldQuizSearch: OldQuizSearch;
  newQuizSearch: NewQuizSearch;
  public _state: ContentSearch["_state"];
  getLinks(data: Record<string, any>[]): Promise<Link[]> {
    return (async () => [])();
  }
  public page: Writable<number> = writable(1);
  public perPage: Writable<number> = writable(12);
  public query: Writable<string> = writable("");
  public url: Readable<string> = readable("");
  public data: Readable<Promise<Link[]>>;
  public links: Readable<
    Promise<{
      current?: string | undefined;
      prev?: string | undefined;
      first?: string | undefined;
      last?: string | undefined;
    }>
  >;
  public total: Readable<Promise<number>>;
  constructor(...args: ConstructorParameters<typeof ContentSearch>) {
    this.oldQuizSearch = new OldQuizSearch(...args);
    this.newQuizSearch = new NewQuizSearch(...args);

    this.page.subscribe((page) => {
      this.oldQuizSearch.page.set(page);
      this.newQuizSearch.page.set(page);
    });
    this.perPage.subscribe((perPage) => {
      this.oldQuizSearch.perPage.set(perPage);
      this.newQuizSearch.perPage.set(perPage);
    });
    this.query.subscribe((query) => {
      this.oldQuizSearch.query.set(query);
      this.newQuizSearch.query.set(query);
    });
    this._state = derived(
      [this.newQuizSearch._state, this.oldQuizSearch._state],
      ($quizType) => {
        return Promise.all([$quizType[0], $quizType[1]]).then(([u1, u2]) => ({
          ...u1,
          data: [...u1.data, ...u2.data],
          total: (u1.total || 0) + (u2.total || 0),
        }));
      }
    );
    this.data = derived(this._state, ($state) => $state.then((s) => s.data));
    this.links = derived(this._state, ($state) => $state.then((s) => s.links));
    this.total = derived(this._state, ($state) =>
      $state.then((s) => s.total || s.data.length)
    );
  }
}

export class PageSearch extends ContentSearch<Link> {
  urlBase = `/api/v1/courses/${COURSE_ID}/pages`;
  async getLinks(data: Record<string, any>[]) {
    return data.map<Link>((p) => {
      return {
        name: p.title,
        url: p.html_url,
        type: InternalLinks.Pages,
        published: p.published,
      };
    });
  }
}

export class ModuleSearch<F extends boolean> extends ContentSearch<
  Link & {
    id: string;
    items?: { id: number; published: boolean; page_url?: string }[];
  }
> {
  get urlBase() {
    return `/api/v1/courses/${COURSE_ID}/modules${
      this.includeItems ? "?include[]=items" : ""
    }`;
  }
  constructor(
    query?: string,
    public includeItems: F = false as F,
    page?: number,
    perPage?: number
  ) {
    super(query, page, perPage);
  }
  async getLinks(data: Record<string, any>[]) {
    return data.map<
      Link & {
        id: string;
        page_url?: string;
        items?: { id: number; published: boolean; page_url?: string }[];
      }
    >((m) => {
      return {
        id: m.id,
        name: m.name,
        url: `/courses/${COURSE_ID}/modules/${m.id}`,
        type: InternalLinks.Modules,
        published: m.published,
        items: this.includeItems ? m.items : undefined,
      };
    });
  }
}

export class NavigationSearch extends ContentSearch<Link> {
  public perPage = writable(NaN);
  urlBase = `/api/v1/courses/${COURSE_ID}/tabs`;
  constructor() {
    super(undefined, undefined, NaN);
  }
  async getLinks(data: Record<string, any>[]) {
    return data.map<Link>((n) => {
      return {
        name: n.label,
        url: n.html_url,
        type: InternalLinks.Navigation,
        published: !n.hidden,
      };
    });
  }
}

export function searchContent<T extends InternalLinks>(
  linkType?: T,
  query: string | undefined = undefined,
  filter = FitlerTypes.All
) {
  if (import.meta.env.DEV && window.location.hostname === "localhost") {
    return mockData;
  }
  if (!COURSE_ID) return new MockSearch<Image>();
  switch (linkType) {
    case InternalLinks.File:
      return new FileSearch(query, filter);
    case InternalLinks.Announcements:
      return new AnnouncementSearch(query);
    case InternalLinks.Discussions:
      return new DiscussionSearch(query);
    case InternalLinks.Assignments:
      return new AssignmentSearch(query);
    case InternalLinks.Quizzes:
      return new QuizSearch(query);
    case InternalLinks.Pages:
      return new PageSearch(query);
    case InternalLinks.Modules:
      return new ModuleSearch(query);
    case InternalLinks.Navigation:
      return new NavigationSearch(query);
    default:
      return new MockSearch<Image>();
  }
}

export const getImageUrl = (file: any) => {
  if (import.meta.env.DEV && window.location.hostname === "localhost") {
    return `https://canvas.auckland.ac.nz/courses/77467/files/${file.id}/preview`;
  }
  return new URL(
    `/courses/${COURSE_ID}/files/${file.id}/preview`,
    document.URL
  ).toString();
};

export function getIcon(l: Link) {
  switch (l.type) {
    case InternalLinks.File:
      return "file";
    case InternalLinks.Announcements:
      return "announcement";
    case InternalLinks.Discussions:
      return "discussion";
    case InternalLinks.Assignments:
      return "assignment";
    case InternalLinks.Quizzes:
      return "quiz";
    case InternalLinks.Pages:
      return "document";
    case InternalLinks.Modules:
      return "module";
    case InternalLinks.Navigation:
    default:
      return "";
  }
}
