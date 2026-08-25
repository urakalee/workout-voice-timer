"use client";

import { useEffect, useRef } from "react";
import type { MovementVisual } from "./exercise-guides";

type Point = [number, number];
type Pose = {
  head: Point;
  neck: Point;
  shoulderL: Point;
  shoulderR: Point;
  elbowL: Point;
  elbowR: Point;
  handL: Point;
  handR: Point;
  hipL: Point;
  hipR: Point;
  kneeL: Point;
  kneeR: Point;
  footL: Point;
  footR: Point;
};

const FRONT: Pose = {
  head: [80, 13], neck: [80, 23], shoulderL: [69, 27], shoulderR: [91, 27],
  elbowL: [65, 43], elbowR: [95, 43], handL: [63, 57], handR: [97, 57],
  hipL: [74, 53], hipR: [86, 53], kneeL: [73, 72], kneeR: [87, 72],
  footL: [70, 91], footR: [90, 91],
};

function pose(patch: Partial<Pose>): Pose {
  return { ...FRONT, ...patch };
}

const POSES: Record<MovementVisual, [Pose, Pose]> = {
  march: [
    pose({ elbowL: [64, 39], handL: [72, 51], elbowR: [96, 38], handR: [90, 48], kneeL: [72, 66], footL: [72, 82] }),
    pose({ elbowL: [64, 38], handL: [70, 48], elbowR: [96, 39], handR: [88, 51], kneeR: [88, 64], footR: [91, 79] }),
  ],
  shoulders: [
    pose({ elbowL: [60, 30], handL: [53, 39], elbowR: [100, 30], handR: [107, 39] }),
    pose({ elbowL: [55, 23], handL: [51, 12], elbowR: [105, 23], handR: [109, 12] }),
  ],
  hinge: [
    pose({}),
    pose({ head: [111, 30], neck: [104, 36], shoulderL: [93, 40], shoulderR: [105, 41], elbowL: [97, 52], elbowR: [110, 53], handL: [104, 63], handR: [116, 63], hipL: [75, 55], hipR: [87, 55], kneeL: [71, 73], kneeR: [85, 73], footL: [68, 91], footR: [89, 91] }),
  ],
  "squat-step": [
    pose({ head: [80, 22], neck: [80, 31], shoulderL: [69, 35], shoulderR: [91, 35], elbowL: [62, 46], elbowR: [98, 46], handL: [72, 51], handR: [88, 51], hipL: [72, 59], hipR: [88, 59], kneeL: [65, 72], kneeR: [95, 72], footL: [60, 91], footR: [100, 91] }),
    pose({ kneeL: [72, 72], footL: [67, 91], kneeR: [97, 71], footR: [116, 87], elbowL: [63, 42], handL: [70, 50], elbowR: [97, 42], handR: [90, 50] }),
  ],
  "step-jack": [
    pose({}),
    pose({ elbowL: [57, 18], elbowR: [103, 18], handL: [70, 5], handR: [90, 5], kneeL: [67, 70], footL: [48, 91], kneeR: [89, 71], footR: [91, 91] }),
  ],
  "ab-wheel": [
    pose({ head: [102, 25], neck: [96, 32], shoulderL: [87, 37], shoulderR: [96, 39], elbowL: [106, 49], elbowR: [113, 52], handL: [120, 60], handR: [124, 62], hipL: [69, 52], hipR: [76, 54], kneeL: [55, 76], kneeR: [61, 78], footL: [42, 84], footR: [47, 88] }),
    pose({ head: [121, 34], neck: [113, 40], shoulderL: [102, 44], shoulderR: [111, 46], elbowL: [119, 54], elbowR: [126, 57], handL: [132, 64], handR: [136, 66], hipL: [75, 57], hipR: [83, 59], kneeL: [58, 77], kneeR: [64, 80], footL: [44, 85], footR: [49, 89] }),
  ],
  "high-knee": [
    pose({ elbowL: [63, 37], handL: [72, 48], elbowR: [97, 40], handR: [89, 52], kneeL: [69, 60], footL: [80, 69] }),
    pose({ elbowL: [63, 40], handL: [71, 52], elbowR: [97, 37], handR: [88, 48], kneeR: [91, 60], footR: [80, 69] }),
  ],
  squat: [
    pose({}),
    pose({ head: [80, 24], neck: [80, 33], shoulderL: [69, 37], shoulderR: [91, 37], elbowL: [60, 47], elbowR: [100, 47], handL: [75, 51], handR: [85, 51], hipL: [71, 61], hipR: [89, 61], kneeL: [62, 75], kneeR: [98, 75], footL: [57, 91], footR: [103, 91] }),
  ],
  boxing: [
    pose({ shoulderL: [70, 28], shoulderR: [90, 26], elbowL: [67, 40], handL: [76, 34], elbowR: [102, 32], handR: [126, 31], hipL: [74, 54], hipR: [87, 51], footL: [64, 91], footR: [98, 88] }),
    pose({ shoulderL: [70, 26], shoulderR: [90, 28], elbowL: [58, 32], handL: [34, 31], elbowR: [93, 40], handR: [84, 34], hipL: [73, 51], hipR: [86, 54], footL: [62, 88], footR: [99, 91] }),
  ],
  "reverse-lunge": [
    pose({}),
    pose({ head: [77, 20], neck: [77, 30], shoulderL: [67, 34], shoulderR: [88, 34], elbowL: [61, 47], elbowR: [94, 47], handL: [69, 56], handR: [86, 56], hipL: [71, 58], hipR: [83, 58], kneeL: [64, 73], footL: [56, 90], kneeR: [100, 75], footR: [117, 90] }),
  ],
  "wall-pushup": [
    pose({ head: [100, 22], neck: [94, 30], shoulderL: [83, 34], shoulderR: [95, 35], elbowL: [105, 42], elbowR: [108, 46], handL: [120, 37], handR: [121, 49], hipL: [73, 54], hipR: [82, 55], kneeL: [61, 72], kneeR: [69, 73], footL: [48, 90], footR: [57, 91] }),
    pose({ head: [114, 23], neck: [107, 31], shoulderL: [96, 35], shoulderR: [107, 36], elbowL: [112, 42], elbowR: [114, 48], handL: [122, 37], handR: [123, 50], hipL: [79, 55], hipR: [88, 56], kneeL: [64, 73], kneeR: [72, 74], footL: [50, 90], footR: [59, 91] }),
  ],
  "slow-march": [
    pose({ elbowL: [65, 42], handL: [70, 54], elbowR: [95, 42], handR: [90, 54], kneeL: [72, 68], footL: [73, 84] }),
    pose({ elbowL: [65, 42], handL: [70, 54], elbowR: [95, 42], handR: [90, 54], kneeR: [88, 68], footR: [87, 84] }),
  ],
  "calf-stretch": [
    pose({ head: [103, 19], neck: [96, 28], shoulderL: [84, 33], shoulderR: [96, 34], elbowL: [103, 40], elbowR: [106, 48], handL: [121, 37], handR: [122, 52], hipL: [76, 54], hipR: [84, 55], kneeL: [64, 72], footL: [52, 91], kneeR: [92, 72], footR: [106, 91] }),
    pose({ head: [109, 19], neck: [101, 28], shoulderL: [89, 33], shoulderR: [101, 34], elbowL: [107, 40], elbowR: [110, 48], handL: [123, 37], handR: [124, 52], hipL: [79, 54], hipR: [87, 55], kneeL: [66, 72], footL: [50, 91], kneeR: [96, 72], footR: [110, 91] }),
  ],
  "quad-stretch": [
    pose({ handR: [112, 42], elbowR: [103, 34], kneeR: [99, 73], footR: [108, 58], handL: [63, 55] }),
    pose({ handR: [110, 46], elbowR: [101, 37], kneeR: [98, 74], footR: [108, 60], handL: [61, 54], hipR: [87, 54] }),
  ],
  "chest-open": [
    pose({ elbowL: [63, 42], elbowR: [97, 42], handL: [74, 56], handR: [86, 56] }),
    pose({ shoulderL: [67, 26], shoulderR: [93, 26], elbowL: [58, 40], elbowR: [102, 40], handL: [73, 57], handR: [87, 57] }),
  ],
  breathing: [
    pose({ elbowL: [65, 42], handL: [78, 43], elbowR: [95, 45], handR: [83, 53] }),
    pose({ shoulderL: [68, 26], shoulderR: [92, 26], elbowL: [64, 42], handL: [78, 42], elbowR: [96, 45], handR: [83, 53] }),
  ],
};

function interpolate(a: Point, b: Point, amount: number): Point {
  return [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount];
}

function interpolatePose(a: Pose, b: Pose, amount: number): Pose {
  return Object.fromEntries(Object.keys(a).map((key) => [key, interpolate(a[key as keyof Pose], b[key as keyof Pose], amount)])) as Pose;
}

function drawDiagram(context: CanvasRenderingContext2D, visual: MovementVisual, frame: number, width: number, height: number) {
  const [start, end] = POSES[visual];
  const oscillation = (Math.sin(frame) + 1) / 2;
  const amount = oscillation * oscillation * (3 - 2 * oscillation);
  const current = interpolatePose(start, end, amount);
  const scaleX = width / 160;
  const scaleY = height / 100;
  const point = ([x, y]: Point): Point => [x * scaleX, y * scaleY];
  const line = (from: Point, to: Point) => {
    const [x1, y1] = point(from);
    const [x2, y2] = point(to);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  };

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f4f2e9";
  context.fillRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (["wall-pushup", "calf-stretch", "quad-stretch"].includes(visual)) {
    context.strokeStyle = "#9db3ab";
    context.lineWidth = 3;
    line([126, 10], [126, 93]);
  }
  if (visual === "ab-wheel") {
    const wheelX = (128 + amount * 9) * scaleX;
    const wheelY = 72 * scaleY;
    context.strokeStyle = "#14735f";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(wheelX, wheelY, Math.min(scaleX, scaleY) * 7, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#20a486";
    context.fillRect(wheelX - 15 * scaleX, wheelY - 15 * scaleY, 30 * scaleX, 5 * scaleY);
  }

  context.strokeStyle = "#102f2d";
  context.lineWidth = Math.max(3, Math.min(scaleX, scaleY) * 3.2);
  line(current.neck, [(current.hipL[0] + current.hipR[0]) / 2, (current.hipL[1] + current.hipR[1]) / 2]);
  line(current.shoulderL, current.shoulderR);
  line(current.shoulderL, current.elbowL);
  line(current.elbowL, current.handL);
  line(current.shoulderR, current.elbowR);
  line(current.elbowR, current.handR);
  line(current.hipL, current.hipR);
  line(current.hipL, current.kneeL);
  line(current.kneeL, current.footL);
  line(current.hipR, current.kneeR);
  line(current.kneeR, current.footR);

  const [headX, headY] = point(current.head);
  context.fillStyle = "#f0b08f";
  context.beginPath();
  context.arc(headX, headY, Math.min(scaleX, scaleY) * 6.2, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = "#20a486";
  context.lineWidth = Math.max(2, Math.min(scaleX, scaleY) * 2);
  if (["shoulders", "breathing"].includes(visual)) {
    const center = point(visual === "shoulders" ? [80, 29] : [80, 45]);
    context.beginPath();
    context.arc(center[0], center[1], Math.min(scaleX, scaleY) * (10 + amount * 7), 0, Math.PI * 2);
    context.stroke();
  }
  if (["march", "high-knee", "slow-march", "step-jack", "boxing"].includes(visual)) {
    context.globalAlpha = 0.32;
    const echo = amount > 0.5 ? start : end;
    context.strokeStyle = "#20a486";
    line(echo.kneeL, echo.footL);
    line(echo.kneeR, echo.footR);
    line(echo.elbowL, echo.handL);
    line(echo.elbowR, echo.handR);
    context.globalAlpha = 1;
  }
}

export function MovementDiagram({ visual, label }: { visual: MovementVisual; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let startedAt = performance.now();

    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const density = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(rect.width * density));
      const height = Math.max(1, Math.round(rect.height * density));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      drawDiagram(context, visual, reduceMotion ? 0.8 : ((now - startedAt) / 900), width, height);
      if (!reduceMotion) animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrame);
      startedAt = 0;
    };
  }, [visual]);

  return <canvas ref={canvasRef} className="movement-canvas" role="img" aria-label={`${label}动作示意动画`} />;
}
