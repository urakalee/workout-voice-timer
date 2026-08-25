import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://workout.example/", {
      headers: { accept: "text/html", host: "workout.example" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the workout application metadata and default plan", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>动起来｜语音训练计时器<\/title>/);
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /property="og:image" content="https:\/\/workout\.example\/og\.png"/);
  assert.match(html, /25 分钟室内训练/);
  assert.match(html, /开始训练/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("includes configurable timeline, voice, drag-and-drop, and offline support", async () => {
  const [page, guides, diagram, manifestText, serviceWorker, packageText] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/exercise-guides.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/movement-diagram.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /createDefaultRoutine/);
  assert.match(page, /DndContext/);
  assert.match(page, /horizontalListSortingStrategy/);
  assert.match(page, /SelectedActivityEditor/);
  assert.match(page, /左右滑动查看全部/);
  assert.match(page, /SpeechSynthesisUtterance/);
  assert.match(page, /wakeLock\.request/);
  assert.match(page, /localStorage\.setItem/);
  assert.match(page, /dongqilai-workout-backup/);
  assert.match(page, /导出备份/);
  assert.match(page, /导入备份/);
  assert.match(page, /ExerciseGuidePanel/);
  assert.match(guides, /前20秒约80–90步\/分/);
  assert.match(guides, /无跳开合步：一只脚向右迈一步|右脚向右迈一步/);
  assert.match(guides, /前臂向下、向后压支撑垫/);
  assert.match(guides, /现在切换到交替后撤点地/);
  assert.match(guides, /atFraction: 0\.5/);
  assert.match(page, /findVoiceGuidance/);
  assert.match(page, /timed-/);
  assert.equal((guides.match(/activityId: "/g) ?? []).length, 17);
  assert.match(diagram, /requestAnimationFrame/);
  assert.match(diagram, /prefers-reduced-motion/);
  assert.match(page, /原地快走或交替抬膝/);
  assert.match(page, /健腹轮/);

  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, ".");
  assert.equal(manifest.scope, ".");
  assert.equal(manifest.name, "动起来｜语音训练计时器");

  assert.match(serviceWorker, /move-workout-v2/);
  assert.match(serviceWorker, /APP_ROOT/);
  assert.match(serviceWorker, /caches\.open/);
  assert.doesNotMatch(packageText, /react-loading-skeleton|site-creator-vinext-starter/);
});
