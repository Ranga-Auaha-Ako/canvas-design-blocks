import { File } from "./search";

const mockImages = import.meta.glob("./mock-assets/*.jpg", {
  eager: true,
  import: "default",
});
const mockThumbs = import.meta.glob("./mock-assets/thumb/*.jpg", {
  eager: true,
  import: "default",
});

export default Object.entries(mockImages).map<File>(([name, image], i) => {
  const filename = name.split("/").pop();
  const matchedThumb = Object.entries(mockThumbs).find(([thumbName]) =>
    thumbName.includes(filename || "\0")
  );
  return {
    name: filename || `File ${i}`,
    display_name: filename || `File ${i}`,
    created_at: "0",
    url: `${image}`,
    image: `${image}`,
    thumbnail_url: `${matchedThumb ? matchedThumb[1] : image}`,
    size: 100,
    preview: "",
  } as File;
});
