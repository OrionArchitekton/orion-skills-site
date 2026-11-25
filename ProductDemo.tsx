import React from 'react';
import { PRODUCT_DEMO as demo } from './product-demo';

export function ProductDemo() {
  const media = `/works/${demo.slug}/media/${demo.slug}-demo`;
  return (
    <section
      id="product-demo"
      aria-labelledby="product-demo-title"
      className="rounded-lg border border-[#334155] bg-[#091638] p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="product-demo-title" className="font-display text-2xl font-bold text-[#F8FAFC]">
          {demo.title}
        </h2>
        <span className="rounded border border-[#64748B] bg-[#102252] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[#F0975A]">
          Recorded Walkthrough
        </span>
      </div>
      <video
        controls
        playsInline
        preload="none"
        poster={`${media}.jpg`}
        width="1920"
        height="1080"
        aria-labelledby="product-demo-title"
        aria-describedby="product-demo-disclosure"
        className="product-demo-player w-full rounded-md border border-[#334155] bg-[#040D24]"
      >
        <source src={`${media}.mp4`} type="video/mp4" />
        <track kind="captions" src={`${media}.vtt`} srcLang="en" label="English" />
        Your browser cannot play this video. Use the download link below.
      </video>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <a
          href={`${media}.mp4`}
          download
          className="inline-flex min-h-[44px] items-center rounded border border-[#64748B] bg-[#102252] px-4 py-2 font-medium text-[#F8FAFC] underline underline-offset-4 transition-colors hover:border-[#F0975A] hover:text-[#FFC08B]"
        >
          Download the demo video
        </a>
        {demo.publishedVideo && (
          <a
            href={demo.publishedVideo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center font-medium text-[#F0975A] underline underline-offset-4 hover:text-[#FFC08B]"
          >
            Watch the original on YouTube
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>
      <p id="product-demo-disclosure" className="mt-3 text-xs leading-6 text-[#94A3B8]">
        {demo.disclosure}
      </p>
      <details className="mt-4 rounded border border-[#334155] bg-[#040D24] p-4 text-sm leading-6 text-[#E2E8F0]">
        <summary className="cursor-pointer font-medium text-[#F8FAFC] hover:text-[#FFC08B]">
          Read the transcript
        </summary>
        <p className="mt-3 text-[#CBD5E1]">{demo.transcript}</p>
      </details>
    </section>
  );
}
