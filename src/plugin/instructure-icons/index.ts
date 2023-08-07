// import { Plugin } from "vite"
// import MagicString from "magic-string"
// import { bundleRequire } from "bundle-require"
// import * as instructureIcons from "@instructure/ui-icons/lib/font/index.js";

// export default function myPlugin() {
//   const virtualModuleId = 'virtual:my-module'
//   const resolvedVirtualModuleId = '\0' + virtualModuleId
// 	return {
// 		name: "instructure-icons",
// 		enforce: "pre",
// 		resolveId(id) {
// 			if (id === virtualModuleId) {
// 				return resolvedVirtualModuleId
// 			}
// 		}
// 		load(id) {
// 			if (id === resolvedVirtualModuleId) {
// 				const ms = new MagicString(`export default ${JSON.stringify(instructureIcons)}`)
// 				return ms.toString()
// 			}
// 		}
// 	}
// }
