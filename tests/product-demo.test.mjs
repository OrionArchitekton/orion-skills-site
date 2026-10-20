import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const slug = 'orion-skills';
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const decodeText = s => s.replace(/&#x([0-9a-f]+);/gi, (_,n) => String.fromCodePoint(parseInt(n,16)))
  .replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const normalize = s => decodeText(s).replace(/\s+/g,' ').trim();
test('product demo is accessible in the built document and uses this product media', () => {
  const videos = [...html.matchAll(/<video\b[^>]*>[\s\S]*?<\/video>/g)];
  assert.equal(videos.length, 1, 'one native product demo must exist without JavaScript');
  const player = videos[0][0];
  assert.match(player, /\bcontrols(?:[ =/>])/);
  assert.match(player, /preload="none"/);
  assert.doesNotMatch(player, /\bautoplay\b/i);
  assert.ok(player.includes(`/works/${slug}/media/${slug}-demo.mp4`));
  assert.ok(player.includes(`/works/${slug}/media/${slug}-demo.vtt`));
  assert.match(player, /kind="captions"/);
  assert.match(player, /src[Ll]ang="en"/);
  assert.ok(player.includes(`/works/${slug}/media/${slug}-demo.jpg`));
  const download = html.replace(player,'').match(/<a\b[^>]*\bdownload(?:[ =/>])[^>]*>Download the demo video<\/a>/)?.[0];
  assert.ok(download, 'download remains visible outside the native player');
  assert.ok(download.includes(`href="/works/${slug}/media/${slug}-demo.mp4"`));
  assert.match(html, /<summary[^>]*>Read the transcript<\/summary>/);
  assert.match(html, /id="product-demo-disclosure"/);
  const manifest = JSON.parse(readFileSync(new URL('../demos/product/media-manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.slug, slug);
  const disclosure = html.match(/<p\b[^>]*id="product-demo-disclosure"[^>]*>([\s\S]*?)<\/p>/)?.[1];
  assert.ok(normalize(disclosure ?? '').includes(manifest.demonstrated_version));
  const transcript = html.match(/<summary[^>]*>Read the transcript<\/summary><p[^>]*>([\s\S]*?)<\/p>/)?.[1];
  assert.ok(normalize(transcript ?? '').split(' ').length > 20, 'a complete readable transcript is available');
  const captions = readFileSync(new URL(`../dist/media/${slug}-demo.vtt`,import.meta.url),'utf8')
    .split(/\n\s*\n/).slice(1).flatMap(block=>block.split('\n').filter(line=>line && !line.includes('-->') && !/^\d+$/.test(line))).join(' ');
  assert.equal(normalize(transcript),normalize(captions),'transcript matches the captioned narration');
  for (const ext of ['mp4','jpg','vtt']) {
    const name = `${slug}-demo.${ext}`;
    const url = `/works/${slug}/media/${name}`;
    assert.ok(player.includes(url), `player exposes ${url}`);
    const upstreamPath = url.slice(`/works/${slug}/`.length);
    const bytes = readFileSync(new URL(`../dist/${upstreamPath}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.files[name]);
    if (ext === 'vtt') {
      assert.ok(bytes.toString().startsWith('WEBVTT'));
      assert.match(bytes.toString(), /\d\d:\d\d:\d\d\.\d{3} --> /);
    }
  }
});
