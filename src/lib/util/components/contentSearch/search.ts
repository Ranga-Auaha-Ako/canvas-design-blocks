import mock from "./mock";

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
}
export interface Image extends File {
  image: string;
  thumbnail_url: string;
}

const COURSE_ID = window.ENV?.COURSE_ID;

export async function searchFiles(
  query: string | undefined = undefined,
  filter = FitlerTypes.All
): Promise<typeof filter extends FitlerTypes.Images ? Image[] : File[]> {
  const url = `/api/v1/courses/${COURSE_ID}/files?${
    filter === FitlerTypes.Images ? "content_types=image&" : ""
  }sort=created_at&order=desc${
    query ? `&search_term=${query}` : ""
  }&per_page=12&limit=12`;
  const response = await fetch(url);
  const files = (await response.json()) as Record<string, any>[];
  if (!files) return [];
  return files.map<typeof filter extends FitlerTypes.Images ? Image : File>(
    (f) => {
      let file: any = {
        name: f.display_name,
        size: f.size,
        url: f.url,
        type: InternalLinks.File,
        published: f.published,
      };
      if (filter === FitlerTypes.Images) {
        file.image = getImageUrl(f);
      }
      return file;
    }
  );
}

async function searchDiscussions(query?: string, type?: InternalLinks) {
  const url = `/api/v1/courses/${COURSE_ID}/discussion_topics?${
    type === InternalLinks.Announcements ? "only_announcements=true&" : ""
  }per_page=12&limit=12${query ? `&search_term=${query}` : ""}`;
  const response = await fetch(url);
  const announcements = (await response.json()) as Record<string, any>[];
  if (!announcements) return [];
  return announcements.map<Link>((a) => {
    return {
      name: a.title,
      url: a.html_url,
      type: InternalLinks.Discussions,
      published: a.published,
    };
  });
}

async function searchAssignments(query?: string) {
  const url = `/api/v1/courses/${COURSE_ID}/assignments?per_page=12&limit=12${
    query ? `&search_term=${query}` : ""
  }`;
  const response = await fetch(url);
  const assignments = (await response.json()) as Record<string, any>[];
  if (!assignments) return [];
  return assignments.map<Link>((a) => {
    return {
      name: a.name,
      url: a.html_url,
      type: InternalLinks.Assignments,
      published: a.published,
    };
  });
}

async function searchQuizzes(query?: string) {
  const url = `/api/v1/courses/${COURSE_ID}/quizzes?per_page=12&limit=12${
    query ? `&search_term=${query}` : ""
  }`;
  const response = await fetch(url);
  const quizzes = (await response.json()) as Record<string, any>[];
  if (!quizzes) return [];
  return quizzes.map<Link>((q) => {
    return {
      name: q.title,
      url: q.html_url,
      type: InternalLinks.Quizzes,
      published: q.published,
    };
  });
}

async function searchPages(query?: string) {
  const url = `/api/v1/courses/${COURSE_ID}/pages?per_page=12&limit=12${
    query ? `&search_term=${query}` : ""
  }`;
  const response = await fetch(url);
  const pages = (await response.json()) as Record<string, any>[];
  if (!pages) return [];
  return pages.map<Link>((p) => {
    return {
      name: p.title,
      url: p.url,
      type: InternalLinks.Pages,
      published: p.published,
    };
  });
}

async function searchModules(query?: string) {
  const url = `/api/v1/courses/${COURSE_ID}/modules?per_page=12&limit=12${
    query ? `&search_term=${query}` : ""
  }`;
  const response = await fetch(url);
  const modules = (await response.json()) as Record<string, any>[];
  if (!modules) return [];
  return modules.map<Link>((m) => {
    return {
      name: m.name,
      url: `/courses/${COURSE_ID}/modules/${m.id}`,
      type: InternalLinks.Modules,
      published: m.published,
    };
  });
}

async function searchNavigation(query?: string) {
  const url = `/api/v1/courses/${COURSE_ID}/tabs?per_page=12&limit=12${
    query ? `&search_term=${query}` : ""
  }`;
  const response = await fetch(url);
  const navigation = (await response.json()) as Record<string, any>[];
  if (!navigation) return [];
  return navigation.map<Link>((n) => {
    return {
      name: n.label,
      url: n.html_url,
      type: InternalLinks.Navigation,
      published: n.hidden,
    };
  });
}

export async function searchContent(
  linkType?: InternalLinks,
  query: string | undefined = undefined,
  filter = FitlerTypes.All
): Promise<
  typeof linkType extends InternalLinks.File
    ? typeof filter extends FitlerTypes.Images
      ? Image[]
      : File[]
    : Link[]
> {
  if (import.meta.env.DEV && window.location.hostname === "localhost") {
    // Mock data
    return mock
      .filter((item) => {
        return query
          ? item.name.toLowerCase().includes(query.toLowerCase())
          : true;
      })
      .map<Image>((f) => {
        return { ...f, image: getImageUrl(f) };
      });
  }
  if (!COURSE_ID) return [];
  switch (linkType) {
    case InternalLinks.File:
      return searchFiles(query, filter);
    case InternalLinks.Announcements:
    case InternalLinks.Discussions:
      return searchDiscussions(query, linkType);
    case InternalLinks.Assignments:
      return searchAssignments(query);
    case InternalLinks.Quizzes:
      return searchQuizzes(query);
    case InternalLinks.Pages:
      return searchPages(query);
    case InternalLinks.Modules:
      return searchModules(query);
    case InternalLinks.Navigation:
      return searchNavigation(query);
    default:
      return [];
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
