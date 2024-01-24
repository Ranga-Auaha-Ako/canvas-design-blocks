import { File } from "./search";

const fakeFile = "https://picsum.photos/200/300";
const fakeThumbnail = "https://picsum.photos/20/30";

export default Array(10)
  .fill({})
  .map((_, i) => ({
    name: `File ${i}`,
    display_name: `File ${i}`,
    created_at: "",
    url: `${fakeFile}?index=${i}`,
    image: `${fakeFile}?index=${i}`,
    thumbnail_url: `${fakeThumbnail}?index=${i}`,
    size: 100,
  })) as File[];
