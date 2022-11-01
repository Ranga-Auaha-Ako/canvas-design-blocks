import type { Editor } from "tinymce";

export default (
  editor: Editor,
  title = "Delete Column",
  message = "This row has content in it! Are you sure you want to delete it?",
  confirmAction = "Yes, delete this row"
): Promise<boolean> => {
  return new Promise((resolve) => {
    editor.windowManager.open({
      title: title,
      body: {
        type: "panel",
        items: [
          {
            type: "htmlpanel",
            html: `<p>${message}</p>`,
          },
        ],
      },
      buttons: [
        {
          type: "cancel",
          name: "cancel",
          text: "Cancel",
        },
        {
          type: "submit",
          name: "save",
          text: confirmAction,
          primary: true,
        },
      ],
      onSubmit: (api) => {
        resolve(true);
        api.close();
      },
      onCancel: (api) => {
        resolve(false);
      },
    });
  });
};
