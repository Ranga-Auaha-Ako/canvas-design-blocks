/* eslint-disable no-alert */

export default definePreset({
  name: 'canvas-design-blocks',
  options: {
  },
  handler: async () => {
    await prompt({ name: 'name', text: 'What is the name of this new Block? Use something simple, like "button' })
		if(!opts.prompts.name) {
			return
		}
    extractTemplates({
      templates: 'src/lib/elements/templates',
			to: 'src/lib/elements',
    })
		await renamePaths({
      paths: '**',
      transformer: ({name}) => `${name.replace(/__name/g, opts.prompts.name.toLower())}`,
    })
		await editFiles({
			title: 'Apply element name',
			files: ['resources/**/*.vue', 'src/**/*.php', 'tests/**/*.php', 'bootstrap/app.php'],
			operations:[{
				type: 'replace-variables',
				prefix: '__',
				variables: {
					name: opts.prompts.name.toLower(),
					Name: opts.prompts.name.toLower().charAt(0).toUpperCase() + opts.prompts.name.toLower().slice(1);
				},
			}],
		})

  }
})