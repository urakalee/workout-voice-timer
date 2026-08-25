"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { findExerciseGuide, findVoiceGuidance, type ExerciseGuide } from "./exercise-guides";
import { MovementDiagram } from "./movement-diagram";

type ActivityKind = "timed" | "reps";

type Activity = {
  id: string;
  name: string;
  kind: ActivityKind;
  duration: number;
  rest: number;
  reps: number;
  repeat: number;
  cue: string;
};

type WorkoutBlock = {
  id: string;
  title: string;
  rounds: number;
  activities: Activity[];
};

type Routine = {
  id: string;
  name: string;
  blocks: WorkoutBlock[];
  updatedAt: number;
};

type RoutineLibrary = {
  activeId: string;
  routines: Routine[];
};

type VoiceSettings = {
  enabled: boolean;
  rate: number;
  voiceURI: string;
};

type WorkoutBackup = {
  format: "dongqilai-workout-backup";
  version: 1;
  exportedAt: string;
  library: RoutineLibrary;
  settings: VoiceSettings;
};

type TimelineEvent = {
  id: string;
  activityId: string;
  type: "work" | "rest";
  name: string;
  duration: number;
  cue: string;
  kind: ActivityKind;
  reps: number;
  blockTitle: string;
  round: number;
  roundTotal: number;
  set: number;
  setTotal: number;
  nextName?: string;
};

type PlayerStatus = "idle" | "running" | "paused" | "complete";

const STORAGE_KEY = "move-voice-workout-library-v1";
const SETTINGS_KEY = "move-voice-workout-settings-v1";

const activity = (
  id: string,
  name: string,
  duration: number,
  rest = 0,
  cue = "",
  kind: ActivityKind = "timed",
  reps = 0,
): Activity => ({ id, name, kind, duration, rest, reps, repeat: 1, cue });

function createDefaultRoutine(id = "default-25", name = "25 分钟室内训练"):
  Routine {
  return {
    id,
    name,
    updatedAt: Date.now(),
    blocks: [
      {
        id: "block-warmup",
        title: "动态热身",
        rounds: 1,
        activities: [
          activity("warmup-walk", "原地轻松走", 60, 0, "自然摆臂，逐渐加快步频"),
          activity("warmup-shoulder", "肩部和手臂活动", 60, 0, "肩膀绕环，配合轻柔摆臂"),
          activity("warmup-hip", "髋部活动与髋折叠", 60, 0, "臀部向后推，腰背保持稳定"),
          activity("warmup-squat", "浅蹲与交替后撤步", 60, 0, "膝盖方向与脚尖保持一致"),
          activity("warmup-step", "加速原地走与无跳开合步", 60, 0, "两个动作各做三十秒"),
        ],
      },
      {
        id: "block-core",
        title: "核心训练",
        rounds: 2,
        activities: [
          activity(
            "core-wheel",
            "健腹轮",
            30,
            60,
            "短距离慢速完成，腰部不适时改做死虫",
            "reps",
            5,
          ),
        ],
      },
      {
        id: "block-circuit",
        title: "徒手循环",
        rounds: 2,
        activities: [
          activity("circuit-march", "原地快走或交替抬膝", 40, 20, "身体直立，腹部轻收"),
          activity("circuit-squat", "徒手深蹲", 40, 20, "臀部向后下方移动"),
          activity("circuit-box", "影子拳", 40, 20, "交替出拳，肘部不要锁死"),
          activity("circuit-lunge", "交替后撤弓步", 40, 20, "不稳时改为后撤点地"),
          activity("circuit-jack", "无跳开合步", 40, 20, "左右交替侧迈，不需要跳跃"),
          activity("circuit-push", "墙壁俯卧撑", 40, 20, "身体保持一条直线"),
        ],
      },
      {
        id: "block-cooldown",
        title: "放松恢复",
        rounds: 1,
        activities: [
          activity("cooldown-walk", "原地慢走与呼吸", 60, 0, "逐渐放慢步频和呼吸"),
          activity("cooldown-calf", "小腿拉伸", 60, 0, "左右各三十秒"),
          activity("cooldown-hip", "大腿前侧或髋前侧拉伸", 60, 0, "左右各三十秒"),
          activity("cooldown-chest", "胸部和肩部放松", 60, 0, "轻柔活动，全程无疼痛"),
          activity("cooldown-check", "站立呼吸与身体检查", 60, 0, "确认没有头晕胸闷或异常腰痛"),
        ],
      },
    ],
  };
}

function createSimpleRoutine(id = "simple-25", name = "精简 25 分钟训练"):
  Routine {
  return {
    id,
    name,
    updatedAt: Date.now(),
    blocks: [
      {
        id: "simple-block-warmup",
        title: "熟悉动作与热身",
        rounds: 1,
        activities: [
          activity("simple-warmup-walk", "原地轻松走", 120, 0, "脚步轻，从慢到稍快"),
          activity("simple-warmup-squat", "徒手深蹲", 60, 0, "先做浅蹲，动作稳定比深度重要"),
          activity("simple-warmup-jack", "无跳开合步", 60, 0, "小幅侧迈，始终有一只脚着地"),
          activity("simple-warmup-push", "墙壁俯卧撑", 60, 0, "先站近一些，身体保持一条直线"),
        ],
      },
      {
        id: "simple-block-main",
        title: "五动作循环",
        rounds: 3,
        activities: [
          activity("simple-main-march", "原地快走或交替抬膝", 40, 20, "身体直立，保持还能说短句"),
          activity("simple-main-squat", "徒手深蹲", 40, 20, "臀部向后下方移动"),
          activity("simple-main-jack", "无跳开合步", 40, 20, "左右交替侧迈，不要跳"),
          activity("simple-main-push", "墙壁俯卧撑", 40, 20, "腹部轻收，胸口靠近墙"),
          activity("simple-main-box", "影子拳", 40, 20, "轻快交替出拳，不要锁肘"),
        ],
      },
      {
        id: "simple-block-cooldown",
        title: "放松恢复",
        rounds: 1,
        activities: [
          activity("simple-cooldown-walk", "原地慢走与呼吸", 120, 0, "逐渐放慢脚步，让呼吸平稳"),
          activity("simple-cooldown-calf", "小腿拉伸", 60, 0, "左右各三十秒"),
          activity("simple-cooldown-chest", "胸部和肩部放松", 60, 0, "轻柔舒展，不要挺腰"),
          activity("simple-cooldown-check", "站立呼吸与身体检查", 60, 0, "确认没有头晕胸闷或异常疼痛"),
        ],
      },
    ],
  };
}

const DEFAULT_LIBRARY: RoutineLibrary = {
  activeId: "default-25",
  routines: [createDefaultRoutine(), createSimpleRoutine()],
};

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  rate: 1,
  voiceURI: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIntegerAtLeast(value: unknown, minimum: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum;
}

function isActivity(value: unknown): value is Activity {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" && value.id.length > 0 &&
    typeof value.name === "string" && value.name.length > 0 &&
    (value.kind === "timed" || value.kind === "reps") &&
    isIntegerAtLeast(value.duration, 1) &&
    isIntegerAtLeast(value.rest, 0) &&
    isIntegerAtLeast(value.reps, 0) &&
    isIntegerAtLeast(value.repeat, 1) &&
    typeof value.cue === "string"
  );
}

function isWorkoutBlock(value: unknown): value is WorkoutBlock {
  if (!isRecord(value) || !Array.isArray(value.activities)) return false;
  return (
    typeof value.id === "string" && value.id.length > 0 &&
    typeof value.title === "string" && value.title.length > 0 &&
    isIntegerAtLeast(value.rounds, 1) &&
    value.activities.every(isActivity)
  );
}

function isRoutine(value: unknown): value is Routine {
  if (!isRecord(value) || !Array.isArray(value.blocks)) return false;
  if (
    typeof value.id !== "string" || !value.id ||
    typeof value.name !== "string" || !value.name ||
    typeof value.updatedAt !== "number" || !Number.isFinite(value.updatedAt) ||
    !value.blocks.every(isWorkoutBlock)
  ) return false;

  const sortableIds = new Set<string>();
  for (const block of value.blocks) {
    if (sortableIds.has(block.id)) return false;
    sortableIds.add(block.id);
    for (const item of block.activities) {
      if (sortableIds.has(item.id)) return false;
      sortableIds.add(item.id);
    }
  }
  return true;
}

function parseWorkoutBackup(value: unknown): Pick<WorkoutBackup, "library" | "settings"> | null {
  if (
    !isRecord(value) ||
    value.format !== "dongqilai-workout-backup" ||
    value.version !== 1 ||
    !isRecord(value.library) ||
    !Array.isArray(value.library.routines) ||
    value.library.routines.length === 0 ||
    !value.library.routines.every(isRoutine) ||
    !isRecord(value.settings) ||
    typeof value.settings.enabled !== "boolean" ||
    typeof value.settings.rate !== "number" ||
    !Number.isFinite(value.settings.rate) ||
    typeof value.settings.voiceURI !== "string"
  ) return null;

  const routines = value.library.routines;
  const routineIds = new Set(routines.map((routine) => routine.id));
  if (routineIds.size !== routines.length) return null;
  const activeId = typeof value.library.activeId === "string" && routineIds.has(value.library.activeId)
    ? value.library.activeId
    : routines[0].id;

  return {
    library: { activeId, routines },
    settings: {
      enabled: value.settings.enabled,
      rate: Math.min(1.35, Math.max(0.75, value.settings.rate)),
      voiceURI: value.settings.voiceURI,
    },
  };
}

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneRoutine(source: Routine, name: string): Routine {
  return {
    ...source,
    id: uid("routine"),
    name,
    updatedAt: Date.now(),
    blocks: source.blocks.map((block) => ({
      ...block,
      id: uid("block"),
      activities: block.activities.map((item) => ({ ...item, id: uid("activity") })),
    })),
  };
}

function buildTimeline(routine: Routine): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  routine.blocks.forEach((block) => {
    for (let round = 1; round <= Math.max(1, block.rounds); round += 1) {
      block.activities.forEach((item) => {
        for (let set = 1; set <= Math.max(1, item.repeat); set += 1) {
          events.push({
            id: `${block.id}-${round}-${item.id}-${set}-work`,
            activityId: item.id,
            type: "work",
            name: item.name,
            duration: Math.max(1, item.duration),
            cue: item.cue,
            kind: item.kind,
            reps: item.reps,
            blockTitle: block.title,
            round,
            roundTotal: Math.max(1, block.rounds),
            set,
            setTotal: Math.max(1, item.repeat),
          });

          if (item.rest > 0) {
            events.push({
              id: `${block.id}-${round}-${item.id}-${set}-rest`,
              activityId: item.id,
              type: "rest",
              name: "休息",
              duration: item.rest,
              cue: "",
              kind: "timed",
              reps: 0,
              blockTitle: block.title,
              round,
              roundTotal: Math.max(1, block.rounds),
              set,
              setTotal: Math.max(1, item.repeat),
            });
          }
        }
      });
    }
  });

  return events.map((event, index) => {
    if (event.type !== "rest") return event;
    return {
      ...event,
      nextName: events.slice(index + 1).find((candidate) => candidate.type === "work")?.name,
    };
  });
}

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function spokenDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes && seconds) return `${minutes}分${seconds}秒`;
  if (minutes) return `${minutes}分钟`;
  return `${seconds}秒`;
}

function blockDuration(block: WorkoutBlock) {
  return block.rounds * block.activities.reduce(
    (sum, item) => sum + (item.duration + item.rest) * Math.max(1, item.repeat),
    0,
  );
}

function DurationInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;

  return (
    <div className="duration-field" aria-label={label}>
      <label>
        <span>分</span>
        <input
          aria-label={`${label}分钟`}
          inputMode="numeric"
          min="0"
          type="number"
          value={minutes}
          onChange={(event) =>
            onChange(Math.max(0, Number(event.target.value) || 0) * 60 + seconds)
          }
        />
      </label>
      <span className="duration-colon">:</span>
      <label>
        <span>秒</span>
        <input
          aria-label={`${label}秒`}
          inputMode="numeric"
          max="59"
          min="0"
          type="number"
          value={seconds}
          onChange={(event) =>
            onChange(minutes * 60 + Math.min(59, Math.max(0, Number(event.target.value) || 0)))
          }
        />
      </label>
    </div>
  );
}

function SortableBlockTab({
  block,
  tone,
  selected,
  onSelect,
}: {
  block: WorkoutBlock;
  tone: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: "block" },
  });

  return (
    <article
      className={`block-tab tone-${tone % 4} ${selected ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        className="drag-handle compact-drag"
        type="button"
        aria-label={`拖动${block.title}环节`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <button className="block-tab-select" type="button" onClick={onSelect} aria-pressed={selected}>
        <strong>{block.title}</strong>
        <span>{block.activities.length} 个动作 · {formatTime(blockDuration(block))}</span>
      </button>
      {block.rounds > 1 && <span className="round-badge">{block.rounds} 轮</span>}
    </article>
  );
}

function SortableActivityChip({
  item,
  blockId,
  selected,
  onSelect,
}: {
  item: Activity;
  blockId: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: "activity", blockId },
  });

  return (
    <article
      className={`activity-chip ${selected ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        className="drag-handle compact-drag"
        type="button"
        aria-label={`拖动${item.name}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <button className="activity-chip-select" type="button" onClick={onSelect} aria-pressed={selected}>
        <strong>{item.name}</strong>
        <span>
          {item.kind === "reps" ? `${item.reps} 次 / 最长 ${formatTime(item.duration)}` : formatTime(item.duration)}
          {item.rest > 0 ? ` · 休 ${formatTime(item.rest)}` : ""}
        </span>
      </button>
    </article>
  );
}

function SelectedActivityEditor({
  item,
  blocks,
  blockId,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
}: {
  item: Activity;
  blocks: WorkoutBlock[];
  blockId: string;
  onChange: (patch: Partial<Activity>) => void;
  onMove: (blockId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="selected-editor">
      <div className="selected-editor-heading">
        <div>
          <span className="editor-label">正在编辑动作</span>
          <input
            className="activity-name"
            aria-label="动作名称"
            value={item.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div className="row-actions">
          <button type="button" onClick={onDuplicate} aria-label={`复制${item.name}`}>复制</button>
          <button className="danger-link" type="button" onClick={onDelete} aria-label={`删除${item.name}`}>删除</button>
        </div>
      </div>

      <div className="activity-controls">
        <label className="select-field">
          <span>所属环节</span>
          <select value={blockId} onChange={(event) => onMove(event.target.value)}>
            {blocks.map((block) => <option key={block.id} value={block.id}>{block.title}</option>)}
          </select>
        </label>
        <label className="select-field">
          <span>模式</span>
          <select
            value={item.kind}
            onChange={(event) => onChange({ kind: event.target.value as ActivityKind })}
          >
            <option value="timed">按时间</option>
            <option value="reps">按次数</option>
          </select>
        </label>

        {item.kind === "reps" && (
          <label className="number-field">
            <span>次数</span>
            <input
              inputMode="numeric"
              min="1"
              type="number"
              value={item.reps}
              onChange={(event) => onChange({ reps: Math.max(1, Number(event.target.value) || 1) })}
            />
          </label>
        )}

        <DurationInput
          label={item.kind === "reps" ? "最长时间" : "运动时间"}
          value={item.duration}
          onChange={(duration) => onChange({ duration: Math.max(1, duration) })}
        />

        <DurationInput
          label="动作后休息"
          value={item.rest}
          onChange={(rest) => onChange({ rest })}
        />

        <label className="number-field compact-number">
          <span>重复</span>
          <input
            inputMode="numeric"
            min="1"
            type="number"
            value={item.repeat}
            onChange={(event) => onChange({ repeat: Math.max(1, Number(event.target.value) || 1) })}
          />
        </label>
      </div>

      <label className="cue-field">
        <span>语音动作提示</span>
        <input
          placeholder="可选，例如：腰背保持稳定"
          value={item.cue}
          onChange={(event) => onChange({ cue: event.target.value })}
        />
      </label>
    </article>
  );
}

function ExerciseGuidePanel({ guide, player = false }: { guide: ExerciseGuide; player?: boolean }) {
  const voiceGuidance = findVoiceGuidance(guide.activityId, guide.activityName);

  return (
    <section className={`exercise-guide ${player ? "player-exercise-guide" : ""}`} aria-label={`${guide.activityName}详细指导`}>
      <div className="guide-copy">
        <span className="guide-kicker">动作指导</span>
        <h3>{guide.activityName}</h3>
        {guide.video && (
          <a className="video-guide-link" href={guide.video.url} target="_blank" rel="noreferrer">
            <span className="video-play" aria-hidden="true">▶</span>
            <span>
              <strong>看真人视频示范</strong>
              <small>{guide.video.label} · {guide.video.source}</small>
            </span>
            <span className="external-arrow" aria-hidden="true">↗</span>
          </a>
        )}
        <div className="guide-target">
          <strong>做到什么程度</strong>
          <p>{guide.target}</p>
        </div>
        {voiceGuidance && (
          <div className="voice-plan">
            <strong>训练时会听到</strong>
            <p><span>开始</span>{voiceGuidance.intro}</p>
            {voiceGuidance.timedCues?.map((cue) => (
              <p key={`${cue.atFraction}-${cue.text}`}>
                <span>{cue.atFraction === 0.5 ? "进行到一半" : `进行到约 ${Math.round(cue.atFraction * 100)}%`}</span>
                {cue.text}
              </p>
            ))}
          </div>
        )}
        <ol>
          {guide.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div className="guide-notes">
          <p><strong>常见错误</strong>{guide.mistakes}</p>
          <p><strong>降低难度</strong>{guide.easier}</p>
        </div>
        <details className="diagram-details">
          <summary>查看简图（可选）</summary>
          <div className="guide-visual">
            <MovementDiagram visual={guide.visual} label={guide.activityName} />
            <span>循环示意 · 真人视频和文字说明优先</span>
          </div>
        </details>
        {!player && (
          <p className="guide-sources">
            真人示范仅用于先熟悉动作；训练时以本页的低强度版本为准。<br />
            强度参考：
            <a href="https://www.cdc.gov/physicalactivity/basics/measuring/index.html" target="_blank" rel="noreferrer">CDC 谈话测试</a>
            <span> · </span>
            <a href="https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates" target="_blank" rel="noreferrer">AHA 心率区间</a>
          </p>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [library, setLibrary] = useState<RoutineLibrary>(DEFAULT_LIBRARY);
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState("block-warmup");
  const [selectedActivityId, setSelectedActivityId] = useState("warmup-walk");
  const deadlineRef = useRef(0);
  const announcedRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void>; released?: boolean } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const currentRoutine =
    library.routines.find((routine) => routine.id === library.activeId) ?? library.routines[0];
  const selectedBlock =
    currentRoutine?.blocks.find((block) => block.id === selectedBlockId) ?? currentRoutine?.blocks[0];
  const selectedActivity =
    selectedBlock?.activities.find((item) => item.id === selectedActivityId) ?? selectedBlock?.activities[0];
  const selectedGuide = selectedActivity
    ? findExerciseGuide(selectedActivity.id, selectedActivity.name)
    : undefined;
  const calculatedTimeline = useMemo(
    () => (currentRoutine ? buildTimeline(currentRoutine) : []),
    [currentRoutine],
  );
  const totalSeconds = useMemo(
    () => calculatedTimeline.reduce((sum, event) => sum + event.duration, 0),
    [calculatedTimeline],
  );

  const updateActiveRoutine = useCallback(
    (updater: (routine: Routine) => Routine) => {
      setLibrary((previous) => ({
        ...previous,
        routines: previous.routines.map((routine) =>
          routine.id === previous.activeId ? { ...updater(routine), updatedAt: Date.now() } : routine,
        ),
      }));
    },
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedLibrary = localStorage.getItem(STORAGE_KEY);
        const storedSettings = localStorage.getItem(SETTINGS_KEY);
        if (storedLibrary) {
          const parsed = JSON.parse(storedLibrary) as RoutineLibrary;
          if (parsed.routines?.length) {
            const hasSimpleRoutine = parsed.routines.some((routine) => routine.id === "simple-25");
            setLibrary(hasSimpleRoutine
              ? parsed
              : { ...parsed, routines: [...parsed.routines, createSimpleRoutine()] });
          }
        }
        if (storedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
      } catch {
        // Corrupt local data should never prevent the default plan from loading.
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [hydrated, library]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [hydrated, settings]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || window.location.hostname === "localhost") return;
    const serviceWorkerUrl = new URL("sw.js", window.location.href);
    void navigator.serviceWorker.register(serviceWorkerUrl.pathname);
  }, []);

  const availableVoices = useMemo(() => {
    const chinese = voices.filter((voice) => voice.lang.toLowerCase().startsWith("zh"));
    return chinese.length ? chinese : voices;
  }, [voices]);

  const speak = useCallback(
    (text: string) => {
      if (!settings.enabled || !("speechSynthesis" in window) || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = settings.rate;
      const selected = voices.find((voice) => voice.voiceURI === settings.voiceURI);
      if (selected) utterance.voice = selected;
      window.speechSynthesis.speak(utterance);
    },
    [settings, voices],
  );

  const beep = useCallback((frequency = 720) => {
    const context = audioContextRef.current;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.13);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.14);
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void>; released?: boolean }> };
      };
      if (nav.wakeLock && !wakeLockRef.current) {
        wakeLockRef.current = await nav.wakeLock.request("screen");
      }
    } catch {
      // The player still works when the browser or power mode refuses wake lock.
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release();
    } catch {
      // A released sentinel can safely be ignored.
    } finally {
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && playerOpen && playerStatus === "running") {
        wakeLockRef.current = null;
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [playerOpen, playerStatus, requestWakeLock]);

  const announceEvent = useCallback(
    (event: TimelineEvent) => {
      if (event.type === "rest") {
        speak(`休息${spokenDuration(event.duration)}。${event.nextName ? `下一个动作，${event.nextName}` : "准备结束训练"}`);
        return;
      }

      const round = event.roundTotal > 1 ? `第${event.round}轮。` : "";
      const set = event.setTotal > 1 ? `第${event.set}组。` : "";
      const target =
        event.kind === "reps"
          ? `${event.reps}次，最长${spokenDuration(event.duration)}`
          : spokenDuration(event.duration);
      const voiceGuidance = findVoiceGuidance(event.activityId, event.name);
      const instruction = voiceGuidance?.intro || event.cue;
      const customCue = voiceGuidance && event.cue && event.cue !== voiceGuidance.legacyCue && event.cue !== voiceGuidance.intro
        ? `补充提醒，${event.cue}。`
        : "";
      speak(`${round}${set}开始${event.name}，${target}。${instruction}。${customCue}`);
    },
    [speak],
  );

  const activateEvent = useCallback(
    (index: number, sourceTimeline = timeline) => {
      if (index >= sourceTimeline.length) {
        setPlayerStatus("complete");
        setRemaining(0);
        speak("训练完成。做得很好，请慢慢恢复呼吸");
        beep(880);
        void releaseWakeLock();
        return;
      }

      const event = sourceTimeline[index];
      setCurrentIndex(index);
      setGuideOpen(false);
      setRemaining(event.duration);
      deadlineRef.current = Date.now() + event.duration * 1000;
      announcedRef.current = new Set();
      announceEvent(event);
    },
    [announceEvent, beep, releaseWakeLock, speak, timeline],
  );

  useEffect(() => {
    if (!playerOpen || playerStatus !== "running" || !timeline.length) return;
    const timer = window.setInterval(() => {
      const nextRemaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setRemaining(nextRemaining);

      const current = timeline[currentIndex];
      let spokeTimedCue = false;
      if (current?.type === "work") {
        const voiceGuidance = findVoiceGuidance(current.activityId, current.name);
        const elapsed = current.duration - nextRemaining;
        const dueCues = (voiceGuidance?.timedCues ?? []).filter((cue, index) => {
          const key = `timed-${index}`;
          if (elapsed < current.duration * cue.atFraction || announcedRef.current.has(key)) return false;
          announcedRef.current.add(key);
          return true;
        });
        const latestCue = dueCues.at(-1);
        if (latestCue) {
          speak(latestCue.text);
          spokeTimedCue = true;
        }
      }
      if (current && current.duration > 15 && !spokeTimedCue && nextRemaining === 10 && !announcedRef.current.has("ten")) {
        announcedRef.current.add("ten");
        speak("还有十秒");
      }
      if (nextRemaining > 0 && nextRemaining <= 3 && !announcedRef.current.has(`beep-${nextRemaining}`)) {
        announcedRef.current.add(`beep-${nextRemaining}`);
        beep(nextRemaining === 1 ? 880 : 720);
      }
      if (Date.now() >= deadlineRef.current) activateEvent(currentIndex + 1);
    }, 200);
    return () => window.clearInterval(timer);
  }, [activateEvent, beep, currentIndex, playerOpen, playerStatus, speak, timeline]);

  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
      void releaseWakeLock();
      void audioContextRef.current?.close();
    },
    [releaseWakeLock],
  );

  const startWorkout = () => {
    if (!calculatedTimeline.length) return;
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass && !audioContextRef.current) audioContextRef.current = new AudioContextClass();
    void audioContextRef.current?.resume();
    setTimeline(calculatedTimeline);
    setPlayerOpen(true);
    setPlayerStatus("running");
    void requestWakeLock();
    activateEvent(0, calculatedTimeline);
  };

  const pauseWorkout = () => {
    const nextRemaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
    setRemaining(nextRemaining);
    setPlayerStatus("paused");
    window.speechSynthesis?.cancel();
  };

  const resumeWorkout = () => {
    deadlineRef.current = Date.now() + remaining * 1000;
    setPlayerStatus("running");
    speak("继续训练");
    void requestWakeLock();
  };

  const closePlayer = () => {
    setPlayerOpen(false);
    setPlayerStatus("idle");
    window.speechSynthesis?.cancel();
    void releaseWakeLock();
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !currentRoutine) return;
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === "block") {
      const targetBlockId = overType === "activity" ? over.data.current?.blockId : String(over.id);
      updateActiveRoutine((routine) => {
        const oldIndex = routine.blocks.findIndex((block) => block.id === active.id);
        const newIndex = routine.blocks.findIndex((block) => block.id === targetBlockId);
        if (oldIndex < 0 || newIndex < 0) return routine;
        return { ...routine, blocks: arrayMove(routine.blocks, oldIndex, newIndex) };
      });
      return;
    }

    if (activeType !== "activity") return;
    const sourceBlockId = active.data.current?.blockId as string;
    const targetBlockId =
      overType === "activity" ? (over.data.current?.blockId as string) : String(over.id);

    updateActiveRoutine((routine) => {
      const sourceBlock = routine.blocks.find((block) => block.id === sourceBlockId);
      const targetBlock = routine.blocks.find((block) => block.id === targetBlockId);
      if (!sourceBlock || !targetBlock) return routine;
      const sourceIndex = sourceBlock.activities.findIndex((item) => item.id === active.id);
      if (sourceIndex < 0) return routine;

      if (sourceBlockId === targetBlockId) {
        const targetIndex =
          overType === "activity"
            ? sourceBlock.activities.findIndex((item) => item.id === over.id)
            : sourceBlock.activities.length - 1;
        if (targetIndex < 0) return routine;
        return {
          ...routine,
          blocks: routine.blocks.map((block) =>
            block.id === sourceBlockId
              ? { ...block, activities: arrayMove(block.activities, sourceIndex, targetIndex) }
              : block,
          ),
        };
      }

      const moved = sourceBlock.activities[sourceIndex];
      const targetIndex =
        overType === "activity"
          ? targetBlock.activities.findIndex((item) => item.id === over.id)
          : targetBlock.activities.length;

      return {
        ...routine,
        blocks: routine.blocks.map((block) => {
          if (block.id === sourceBlockId) {
            return { ...block, activities: block.activities.filter((item) => item.id !== active.id) };
          }
          if (block.id === targetBlockId) {
            const next = [...block.activities];
            next.splice(Math.max(0, targetIndex), 0, moved);
            return { ...block, activities: next };
          }
          return block;
        }),
      };
    });
    if (sourceBlockId !== targetBlockId) {
      setSelectedBlockId(targetBlockId);
      setSelectedActivityId(String(active.id));
    }
  };

  const selectBlock = (block: WorkoutBlock) => {
    setSelectedBlockId(block.id);
    setSelectedActivityId(block.activities[0]?.id ?? "");
  };

  const updateSelectedBlock = (patch: Partial<WorkoutBlock>) => {
    if (!selectedBlock) return;
    updateActiveRoutine((routine) => ({
      ...routine,
      blocks: routine.blocks.map((block) =>
        block.id === selectedBlock.id ? { ...block, ...patch } : block,
      ),
    }));
  };

  const addBlock = () => {
    const blockId = uid("block");
    const activityId = uid("activity");
    updateActiveRoutine((routine) => ({
      ...routine,
      blocks: [
        ...routine.blocks,
        {
          id: blockId,
          title: "新环节",
          rounds: 1,
          activities: [activity(activityId, "新动作", 40, 20)],
        },
      ],
    }));
    setSelectedBlockId(blockId);
    setSelectedActivityId(activityId);
  };

  const deleteSelectedBlock = () => {
    if (!selectedBlock || !currentRoutine) return;
    const blockIndex = currentRoutine.blocks.findIndex((block) => block.id === selectedBlock.id);
    const nextBlock = currentRoutine.blocks[blockIndex + 1] ?? currentRoutine.blocks[blockIndex - 1];
    updateActiveRoutine((routine) => ({
      ...routine,
      blocks: routine.blocks.filter((block) => block.id !== selectedBlock.id),
    }));
    setSelectedBlockId(nextBlock?.id ?? "");
    setSelectedActivityId(nextBlock?.activities[0]?.id ?? "");
  };

  const addActivityToSelectedBlock = () => {
    if (!selectedBlock) return;
    const activityId = uid("activity");
    updateActiveRoutine((routine) => ({
      ...routine,
      blocks: routine.blocks.map((block) =>
        block.id === selectedBlock.id
          ? { ...block, activities: [...block.activities, activity(activityId, "新动作", 40, 20)] }
          : block,
      ),
    }));
    setSelectedActivityId(activityId);
  };

  const updateSelectedActivity = (patch: Partial<Activity>) => {
    if (!selectedBlock || !selectedActivity) return;
    updateActiveRoutine((routine) => ({
      ...routine,
      blocks: routine.blocks.map((block) =>
        block.id === selectedBlock.id
          ? {
              ...block,
              activities: block.activities.map((item) =>
                item.id === selectedActivity.id ? { ...item, ...patch } : item,
              ),
            }
          : block,
      ),
    }));
  };

  const duplicateSelectedActivity = () => {
    if (!selectedBlock || !selectedActivity) return;
    const activityId = uid("activity");
    updateActiveRoutine((routine) => ({
      ...routine,
      blocks: routine.blocks.map((block) => {
        if (block.id !== selectedBlock.id) return block;
        const sourceIndex = block.activities.findIndex((item) => item.id === selectedActivity.id);
        if (sourceIndex < 0) return block;
        const activities = [...block.activities];
        activities.splice(sourceIndex + 1, 0, {
          ...selectedActivity,
          id: activityId,
          name: `${selectedActivity.name}－副本`,
        });
        return { ...block, activities };
      }),
    }));
    setSelectedActivityId(activityId);
  };

  const deleteSelectedActivity = () => {
    if (!selectedBlock || !selectedActivity) return;
    const activityIndex = selectedBlock.activities.findIndex((item) => item.id === selectedActivity.id);
    const nextActivity = selectedBlock.activities[activityIndex + 1] ?? selectedBlock.activities[activityIndex - 1];
    updateActiveRoutine((routine) => ({
      ...routine,
      blocks: routine.blocks.map((block) =>
        block.id === selectedBlock.id
          ? { ...block, activities: block.activities.filter((item) => item.id !== selectedActivity.id) }
          : block,
      ),
    }));
    setSelectedActivityId(nextActivity?.id ?? "");
  };

  const moveSelectedActivity = (targetBlockId: string) => {
    if (!selectedBlock || !selectedActivity || targetBlockId === selectedBlock.id) return;
    updateActiveRoutine((routine) => ({
      ...routine,
      blocks: routine.blocks.map((block) => {
        if (block.id === selectedBlock.id) {
          return { ...block, activities: block.activities.filter((item) => item.id !== selectedActivity.id) };
        }
        if (block.id === targetBlockId) {
          return { ...block, activities: [...block.activities, selectedActivity] };
        }
        return block;
      }),
    }));
    setSelectedBlockId(targetBlockId);
    setSelectedActivityId(selectedActivity.id);
  };

  const addRoutineCopy = () => {
    if (!currentRoutine) return;
    const copy = cloneRoutine(currentRoutine, `${currentRoutine.name}－副本`);
    setLibrary((previous) => ({
      activeId: copy.id,
      routines: [...previous.routines, copy],
    }));
    setSelectedBlockId(copy.blocks[0]?.id ?? "");
    setSelectedActivityId(copy.blocks[0]?.activities[0]?.id ?? "");
  };

  const useSimpleRoutine = () => {
    const existing = library.routines.find((routine) => routine.id === "simple-25");
    const simpleRoutine = existing ?? createSimpleRoutine();
    setLibrary((previous) => ({
      activeId: simpleRoutine.id,
      routines: existing ? previous.routines : [...previous.routines, simpleRoutine],
    }));
    setSelectedBlockId(simpleRoutine.blocks[0]?.id ?? "");
    setSelectedActivityId(simpleRoutine.blocks[0]?.activities[0]?.id ?? "");
  };

  const deleteRoutine = () => {
    if (library.routines.length <= 1 || !currentRoutine) return;
    if (!window.confirm(`删除“${currentRoutine.name}”？`)) return;
    const nextRoutine = library.routines.find((routine) => routine.id !== library.activeId);
    setLibrary((previous) => {
      const routines = previous.routines.filter((routine) => routine.id !== previous.activeId);
      return { routines, activeId: routines[0].id };
    });
    setSelectedBlockId(nextRoutine?.blocks[0]?.id ?? "");
    setSelectedActivityId(nextRoutine?.blocks[0]?.activities[0]?.id ?? "");
  };

  const resetRoutine = () => {
    if (!currentRoutine) return;
    const isSimpleRoutine = currentRoutine.id === "simple-25";
    const templateName = isSimpleRoutine ? "精简25分钟方案" : "默认25分钟方案";
    if (!window.confirm(`用${templateName}覆盖当前方案？`)) return;
    const replacement = isSimpleRoutine
      ? createSimpleRoutine(currentRoutine.id, currentRoutine.name)
      : createDefaultRoutine(currentRoutine.id, currentRoutine.name);
    updateActiveRoutine(() => replacement);
    setSelectedBlockId(replacement.blocks[0].id);
    setSelectedActivityId(replacement.blocks[0].activities[0]?.id ?? "");
  };

  const exportBackup = () => {
    const backup: WorkoutBackup = {
      format: "dongqilai-workout-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      library,
      settings,
    };
    const file = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `dongqilai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      window.alert("备份文件过大，无法导入。");
      return;
    }

    try {
      const parsed = parseWorkoutBackup(JSON.parse(await file.text()));
      if (!parsed) {
        window.alert("这个文件不是有效的“动起来”备份。");
        return;
      }
      if (!window.confirm(`导入后将用备份中的 ${parsed.library.routines.length} 个方案覆盖当前内容。继续吗？`)) return;

      const activeRoutine = parsed.library.routines.find((routine) => routine.id === parsed.library.activeId)
        ?? parsed.library.routines[0];
      setLibrary(parsed.library);
      setSettings(parsed.settings);
      setSelectedBlockId(activeRoutine.blocks[0]?.id ?? "");
      setSelectedActivityId(activeRoutine.blocks[0]?.activities[0]?.id ?? "");
      window.alert("备份已导入并保存在当前设备中。");
    } catch {
      window.alert("无法读取这个备份文件，请确认文件没有损坏。");
    }
  };

  const currentEvent = timeline[currentIndex];
  const currentGuide = currentEvent
    ? findExerciseGuide(currentEvent.activityId, currentEvent.name)
    : undefined;
  const nextWork = timeline.slice(currentIndex + 1).find((event) => event.type === "work");
  const elapsedBefore = timeline
    .slice(0, currentIndex)
    .reduce((sum, event) => sum + event.duration, 0);
  const elapsedCurrent = currentEvent ? currentEvent.duration - remaining : 0;
  const playerProgress = totalSeconds
    ? Math.min(100, ((elapsedBefore + elapsedCurrent) / totalSeconds) * 100)
    : 0;

  const openCurrentGuide = () => {
    if (playerStatus === "running") pauseWorkout();
    setGuideOpen(true);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="动起来首页">
          <span className="brand-mark">25′</span>
          <span>
            <strong>动起来</strong>
            <small>语音训练计时器</small>
          </span>
        </a>
        <div className="top-actions">
          <details className="voice-settings">
            <summary>语音设置</summary>
            <div className="settings-panel">
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(event) => setSettings((previous) => ({ ...previous, enabled: event.target.checked }))}
                />
                <span>启用语音提示</span>
              </label>
              <label>
                <span>中文语音</span>
                <select
                  value={settings.voiceURI}
                  onChange={(event) => setSettings((previous) => ({ ...previous, voiceURI: event.target.value }))}
                >
                  <option value="">系统默认</option>
                  {availableVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name}（{voice.lang}）
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>语速：{settings.rate.toFixed(2)}×</span>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.05"
                  value={settings.rate}
                  onChange={(event) => setSettings((previous) => ({ ...previous, rate: Number(event.target.value) }))}
                />
              </label>
              <button className="secondary-button" type="button" onClick={() => speak("语音测试。准备开始训练")}>测试语音</button>
            </div>
          </details>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">跟着声音练，不用反复看表</span>
          <input
            className="routine-title"
            aria-label="训练方案名称"
            value={currentRoutine?.name ?? ""}
            onChange={(event) => updateActiveRoutine((routine) => ({ ...routine, name: event.target.value }))}
          />
          <p>时间、休息、轮数和顺序都可以调整。修改后，倒计时与中文语音会自动重新组装。</p>
        </div>
        <div className="workout-summary">
          <div>
            <span>总时长</span>
            <strong>{formatTime(totalSeconds)}</strong>
          </div>
          <div className="summary-meta">
            <span>{currentRoutine?.blocks.length ?? 0} 个环节</span>
            <span>
              {currentRoutine?.id === "simple-25"
                ? "主训练 5 种动作"
                : `${calculatedTimeline.filter((event) => event.type === "work").length} 个动作节点`}
            </span>
          </div>
          <button className="start-button" type="button" onClick={startWorkout} disabled={!calculatedTimeline.length}>
            <span className="play-symbol">▶</span>
            开始训练
          </button>
        </div>
      </section>

      <section className="plan-toolbar" aria-label="方案工具栏">
        <label className="routine-picker">
          <span>当前方案</span>
          <select
            value={library.activeId}
            onChange={(event) => {
              const nextRoutine = library.routines.find((routine) => routine.id === event.target.value);
              setLibrary((previous) => ({ ...previous, activeId: event.target.value }));
              setSelectedBlockId(nextRoutine?.blocks[0]?.id ?? "");
              setSelectedActivityId(nextRoutine?.blocks[0]?.activities[0]?.id ?? "");
            }}
          >
            {library.routines.map((routine) => (
              <option key={routine.id} value={routine.id}>{routine.name}</option>
            ))}
          </select>
        </label>
        <div className="toolbar-actions">
          <button className="simple-plan-button" type="button" onClick={useSimpleRoutine}>
            使用精简版 <span>主训练 5 个动作</span>
          </button>
          <button className="secondary-button" type="button" onClick={exportBackup}>导出备份</button>
          <button className="secondary-button" type="button" onClick={() => importInputRef.current?.click()}>导入备份</button>
          <input
            ref={importInputRef}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={importBackup}
            aria-label="选择训练备份文件"
          />
          <button className="secondary-button" type="button" onClick={addRoutineCopy}>复制为新方案</button>
          <button className="secondary-button" type="button" onClick={resetRoutine}>
            {currentRoutine?.id === "simple-25" ? "恢复精简模板" : "恢复默认内容"}
          </button>
          <button className="danger-link" type="button" onClick={deleteRoutine} disabled={library.routines.length <= 1}>删除方案</button>
        </div>
      </section>

      <section className="editor-intro">
        <div>
          <span className="section-kicker">训练编排</span>
          <h2>选一个，再细调</h2>
        </div>
        <p>刚开始不必追求动作种类。精简版只用 5 个主训练动作反复练习；环节和动作仍可横向滑动、拖动排序。</p>
      </section>

      {currentRoutine && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <section className="composer-shell" aria-label="训练编排器">
            <div className="composer-level">
              <div className="level-heading">
                <div>
                  <span>第一步</span>
                  <strong>选择或拖动环节</strong>
                </div>
                <small>动作可直接拖到另一个环节卡片</small>
              </div>
              <SortableContext items={currentRoutine.blocks.map((block) => block.id)} strategy={horizontalListSortingStrategy}>
                <div className="horizontal-rail block-rail">
                  {currentRoutine.blocks.map((block, index) => (
                    <SortableBlockTab
                      key={block.id}
                      block={block}
                      tone={index}
                      selected={selectedBlock?.id === block.id}
                      onSelect={() => selectBlock(block)}
                    />
                  ))}
                  <button className="rail-add block-rail-add" type="button" onClick={addBlock}>＋ 新增环节</button>
                </div>
              </SortableContext>
            </div>

            {selectedBlock ? (
              <>
                <div className="block-settings">
                  <label className="block-name-field">
                    <span>当前环节</span>
                    <input
                      aria-label="环节名称"
                      value={selectedBlock.title}
                      onChange={(event) => updateSelectedBlock({ title: event.target.value })}
                    />
                  </label>
                  <label className="round-field">
                    <span>轮数</span>
                    <input
                      inputMode="numeric"
                      min="1"
                      type="number"
                      value={selectedBlock.rounds}
                      onChange={(event) => updateSelectedBlock({ rounds: Math.max(1, Number(event.target.value) || 1) })}
                    />
                  </label>
                  <span className="block-settings-summary">{selectedBlock.activities.length} 个动作 · {formatTime(blockDuration(selectedBlock))}</span>
                  <button className="danger-link" type="button" onClick={deleteSelectedBlock}>删除环节</button>
                </div>

                <div className="composer-level activity-level">
                  <div className="level-heading">
                    <div>
                      <span>第二步</span>
                      <strong>选择或拖动动作</strong>
                    </div>
                    <small>左右滑动查看全部</small>
                  </div>
                  <SortableContext items={selectedBlock.activities.map((item) => item.id)} strategy={horizontalListSortingStrategy}>
                    <div className="horizontal-rail activity-rail">
                      {selectedBlock.activities.map((item) => (
                        <SortableActivityChip
                          key={item.id}
                          blockId={selectedBlock.id}
                          item={item}
                          selected={selectedActivity?.id === item.id}
                          onSelect={() => setSelectedActivityId(item.id)}
                        />
                      ))}
                      <button className="rail-add activity-rail-add" type="button" onClick={addActivityToSelectedBlock}>＋ 新增动作</button>
                    </div>
                  </SortableContext>
                </div>

                {selectedActivity ? (
                  <>
                    <SelectedActivityEditor
                      item={selectedActivity}
                      blocks={currentRoutine.blocks}
                      blockId={selectedBlock.id}
                      onChange={updateSelectedActivity}
                      onMove={moveSelectedActivity}
                      onDuplicate={duplicateSelectedActivity}
                      onDelete={deleteSelectedActivity}
                    />
                    {selectedGuide && <ExerciseGuidePanel guide={selectedGuide} />}
                  </>
                ) : (
                  <div className="empty-editor">
                    <strong>这个环节还没有动作</strong>
                    <button className="secondary-button" type="button" onClick={addActivityToSelectedBlock}>添加第一个动作</button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-editor">
                <strong>还没有训练环节</strong>
                <button className="secondary-button" type="button" onClick={addBlock}>添加第一个环节</button>
              </div>
            )}
          </section>
        </DndContext>
      )}

      <aside className="install-note">
        <span className="install-icon">⌂</span>
        <div>
          <strong>安装到 iPhone</strong>
          <p>正式发布后，在 Safari 中选择“添加到主屏幕”并打开“作为 Web App 打开”。方案保存在当前设备中。</p>
        </div>
      </aside>

      <footer>
        <span>动起来 · 语音训练计时器</span>
        <span>身体出现异常疼痛或胸闷头晕时，请立即停止训练。</span>
      </footer>

      {playerOpen && currentEvent && (
        <div className={`player-overlay ${currentEvent.type === "rest" ? "resting" : ""}`} role="dialog" aria-modal="true" aria-label="训练播放器">
          <div className="player-topbar">
            <button type="button" onClick={closePlayer}>× 结束</button>
            <span>{currentRoutine?.name}</span>
            <span>{Math.min(currentIndex + 1, timeline.length)} / {timeline.length}</span>
          </div>
          <div className="player-progress" aria-label={`训练进度${Math.round(playerProgress)}%`}>
            <span style={{ width: `${playerProgress}%` }} />
          </div>
          <div className="player-content">
            {playerStatus === "complete" ? (
              <div className="complete-state">
                <span className="complete-mark">✓</span>
                <p>训练完成</p>
                <h2>今天的节奏已经走完</h2>
                <button className="start-button" type="button" onClick={closePlayer}>返回训练计划</button>
              </div>
            ) : (
              <>
                <span className="player-section">
                  {currentEvent.blockTitle}
                  {currentEvent.roundTotal > 1 && ` · 第 ${currentEvent.round}/${currentEvent.roundTotal} 轮`}
                </span>
                <h2>{currentEvent.type === "rest" ? "休息一下" : currentEvent.name}</h2>
                {currentEvent.type === "work" && currentEvent.kind === "reps" && (
                  <p className="rep-target">目标 {currentEvent.reps} 次 · 可提前点“下一项”</p>
                )}
                <div className="countdown" aria-live="polite">{formatTime(remaining)}</div>
                <p className="current-cue">
                  {currentEvent.type === "rest"
                    ? nextWork
                      ? `下一个：${nextWork.name}`
                      : "准备完成训练"
                    : currentEvent.cue || "保持平稳呼吸，动作标准优先"}
                </p>
                {currentEvent.type === "work" && currentGuide && (
                  <button className="player-guide-button" type="button" onClick={openCurrentGuide}>
                    ？动作怎么做
                  </button>
                )}
                <div className="player-controls">
                  <button
                    className="round-control"
                    type="button"
                    onClick={() => activateEvent(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    aria-label="上一项"
                  >
                    ‹
                  </button>
                  {playerStatus === "paused" ? (
                    <button className="pause-control" type="button" onClick={resumeWorkout}>▶</button>
                  ) : (
                    <button className="pause-control" type="button" onClick={pauseWorkout}>Ⅱ</button>
                  )}
                  <button className="round-control" type="button" onClick={() => activateEvent(currentIndex + 1)} aria-label="下一项">›</button>
                </div>
                <span className="player-hint">{playerStatus === "paused" ? "训练已暂停" : "屏幕将尽量保持常亮"}</span>
              </>
            )}
          </div>
          {guideOpen && currentGuide && (
            <div className="player-guide-layer">
              <div className="player-guide-sheet">
                <div className="player-guide-heading">
                  <div>
                    <span>训练已暂停</span>
                    <strong>看清动作后再继续</strong>
                  </div>
                  <button type="button" onClick={() => setGuideOpen(false)} aria-label="关闭动作指导">×</button>
                </div>
                <ExerciseGuidePanel guide={currentGuide} player />
                <button className="close-guide-button" type="button" onClick={() => setGuideOpen(false)}>
                  关闭指导，返回计时器
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
