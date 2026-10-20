---
verified: 2026-10-19
review_after: 2027-01-19
topics: [product-demo, release, media]
references: [specs/product-demo-spec.md, demos/product/media-manifest.json, package.json]
---

# Product demo release

1. Review the exact MP4, poster, English captions, transcript and version/disclosures. Keep original human narration when reusing guide footage.
2. Run `npm ci`, `npm run build`, `npm run test:demo`, `npx tsc --noEmit`, and the repository's other checks. Inspect actual playback, seeking and captions at desktop/mobile sizes with JavaScript on and off. Confirm no MP4 preload before interaction; the poster may load.
3. Obtain Dan's approval for this site PR. Merge/deploy only with that authority; preserve this site's project linkage and existing Works rewrite.
4. After release, test https://www.danmercede.com/works/orion-skills/ itself. Match deployed media hashes, verify HTTP byte-range delivery, play using native controls, seek, load captions and check the transcript. A preview or HTTP 200 does not establish public playback.
5. Monitor the product route and media responses for failures. Operator playback is not organic audience activity.

Rollback: revert this PR or restore this site's preceding production deployment. Keep source releases, guides and other products unchanged. Retain failed render evidence outside public source.

Startup validation: Hold the deferred client bundle, start playback with native controls, select captions, then release the bundle. Verify the same player continues with its position and caption selection intact. Native captions stay opt-in because these recordings already contain open captions.
