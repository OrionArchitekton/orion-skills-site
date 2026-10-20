# orion-skills product demonstration

## Scenario
A visitor reaches the product page, starts this product's video deliberately, reads English captions or the transcript, and continues to the existing source/setup links. The same demonstration and disclosures are available without JavaScript.

## Acceptance criteria
- One native 16:9 player near the introduction, with controls and a poster; no autoplay or full MP4 preload before interaction.
- English captions, a readable transcript, and a visible download link outside the player.
- All media resolves under this product's Works path, with the same content before and after client rendering.
- Disclose the demonstrated version, reused/edited source, narration, synthetic inputs and observed scope. Never present a fixture as a live deployment, provider benchmark or independent approval.
- Preserve existing product claims, source/install/guide links and deployment configuration.

- Playback position and selected caption mode survive deferred client startup. Native captions remain opt-in over the existing open captions.

## Test seam decision
The built document and its actual media files form the existing consumer boundary. A built-output check covers accessible markup, product-specific URLs and file integrity; browser proof covers user-triggered audio/video decode, seeking, captions and mobile/no-JavaScript behavior. No tool runtime or provider is needed for site tests. Public playback remains a separate post-approval check.
