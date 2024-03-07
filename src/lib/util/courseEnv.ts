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

export const courseEnv = {
  ...window.ENV,
  COURSE_ID: courseID,
};
