import React from 'react';
import { PRODUCT_DEMO as demo } from './product-demo';
export function ProductDemo() {
  const media = `/works/${demo.slug}/media/${demo.slug}-demo`;
  return <section id="product-demo" aria-labelledby="product-demo-title" className="mt-8 mb-10">
    <h2 id="product-demo-title" className="text-lg font-medium mb-3">{demo.title}</h2>
    <video controls playsInline preload="none" poster={`${media}.jpg`} width="1920" height="1080"
      aria-labelledby="product-demo-title" aria-describedby="product-demo-disclosure"
      className="product-demo-player w-full rounded-md border border-neutral-200 bg-neutral-900">
      <source src={`${media}.mp4`} type="video/mp4" />
      <track kind="captions" src={`${media}.vtt`} srcLang="en" label="English" />
      Your browser cannot play this video. Use the download link below.
    </video>
    <p className="text-sm mt-3"><a href={`${media}.mp4`} download className="underline underline-offset-4">Download the demo video</a></p>
    <p id="product-demo-disclosure" className="text-xs text-neutral-600 leading-6 mt-3">{demo.disclosure}</p>
    {demo.publishedVideo && <p className="text-sm mt-3"><a href={demo.publishedVideo} className="underline underline-offset-4">Watch the original on YouTube</a></p>}
    <details className="mt-4 text-sm leading-6"><summary className="cursor-pointer font-medium">Read the transcript</summary><p className="mt-3 text-neutral-700">{demo.transcript}</p></details>
  </section>;
}
