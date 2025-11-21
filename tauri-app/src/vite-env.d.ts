/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.woff?url' {
  const src: string;
  export default src;
}

declare module '*.woff2?url' {
  const src: string;
  export default src;
}

declare module '*.ttf?url' {
  const src: string;
  export default src;
}
