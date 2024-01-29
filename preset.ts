/* eslint-disable no-alert */

export default definePreset({
  name: "canvas-design-blocks",
  options: {},
  handler: async (opts) => {
    let first = true;
    await prompt({
      name: "name",
      text: 'What is the name of this new Block? Use something simple, like "button"',
      default: "newBlock",
    });
    if (!opts.prompts.name) {
      return;
    }
    await extractTemplates({
      templates: "src/lib/elements/templates",
      to: "src/lib/elements",
      whenConflict: "skip",
    });
    await editFiles({
      title: "Apply element name",
      files: "src/lib/elements/__name/**",
      operations: [
        {
          type: "replace-variables",
          prefix: "__",
          variables: {
            name: opts.prompts.name.toString(),
            Name:
              opts.prompts.name.toString().charAt(0).toUpperCase() +
              opts.prompts.name.toString().slice(1),
          },
        },
      ],
    });
    await renamePaths({
      paths: "src/lib/elements/__name/**",
      transformer: ({ base }) => {
        console.log(base);
        return `${base.replace(/__name/g, opts.prompts.name)}`;
      },
    });

    await renamePaths({
      paths: "src/lib/elements/__name",
      transformer: ({ base }) =>
        `${base.replace(/__name/g, opts.prompts.name)}`,
    });
  },
});
