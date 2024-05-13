let courseID = window.ENV ? window.ENV.COURSE_ID : undefined;
if (!courseID) {
  // Pull from the URL
  const url = new URL(window.location.href);
  const path = url.pathname.split("/");
  const courseIndex = path.indexOf("courses");
  if (courseIndex !== -1 && path.length > courseIndex + 1 && courseIndex < 2) {
    courseID = path[courseIndex + 1];
  }
}

let accountID =
  window.ENV && window.ENV.ACCOUNT_ID
    ? Promise.resolve(window.ENV.ACCOUNT_ID)
    : Promise.resolve(null);
if (!accountID && courseID) {
  // Use API to get account ID
  accountID = fetch(`/api/v1/courses/${courseID}/account`)
    .then((response) => response.json())
    .then((data) => data.account_id);
}
export { accountID as accountIDPromise };

export const courseEnv = {
  ...window.ENV,
  COURSE_ID: courseID,
};

export enum CoursePermission {
  ReadCourseContent = "read_course_content",
  ManageWikiUpdate = "manage_wiki_update",
  ManageWikiCreate = "manage_wiki_create",
}

export async function getCoursePermissions(): Promise<
  Record<CoursePermission, boolean>
> {
  const permissions = Object.values(CoursePermission).reduce(
    (acc, permission) => {
      acc[permission] = false;
      return acc;
    },
    {} as Record<CoursePermission, boolean>
  );
  try {
    const response = await fetch(
      `/api/v1/courses/${courseEnv.COURSE_ID}/permissions?${
        "permissions[]=" +
        Object.values(CoursePermission).join("&permissions[]=")
      }`
    );
    const data = (await response.json()) as Record<CoursePermission, boolean>;
    return { ...permissions, ...data };
  } catch (error) {
    console.error("Failed to fetch course permissions", error);
  }
  return permissions;
}
