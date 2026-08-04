/// <reference types="vite/client" />

declare module '*.ttf' {
  const src: string;
  export default src;
}

declare module '*.pdf' {
  const src: string;
  export default src;
}

declare module 'arabic-reshaper' {
  const arabicReshaper: {
    convertArabic(text: string): string;
    convertArabicBack(text: string): string;
  };
  export = arabicReshaper;
}
