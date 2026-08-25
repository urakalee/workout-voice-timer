export type MovementVisual =
  | "march"
  | "shoulders"
  | "hinge"
  | "squat-step"
  | "step-jack"
  | "ab-wheel"
  | "high-knee"
  | "squat"
  | "boxing"
  | "reverse-lunge"
  | "wall-pushup"
  | "slow-march"
  | "calf-stretch"
  | "quad-stretch"
  | "chest-open"
  | "breathing";

export type ExerciseGuide = {
  activityId: string;
  activityName: string;
  target: string;
  steps: string[];
  mistakes: string;
  easier: string;
  visual: MovementVisual;
};

export const EXERCISE_GUIDES: ExerciseGuide[] = [
  {
    activityId: "warmup-walk",
    activityName: "原地轻松走",
    target: "前20秒约80–90步/分，中间20秒90–100步/分；最后20秒舒服时到100–110步/分。仍能轻松说完整句子，主观强度约2–3/10；热身不必把心率推到125。",
    steps: ["站直但不挺胸，双脚落在髋部正下方。", "脚掌轻落地，自然摆臂；每20秒只加快一点。", "肩颈保持放松，呼吸比静止时稍快即可。"],
    mistakes: "为了追求步数而跺脚、耸肩、身体后仰，或一开始就快速抬膝。",
    easier: "保持80–90步/分，缩小摆臂和抬脚幅度；需要时扶稳固桌面。",
    visual: "march",
  },
  {
    activityId: "warmup-shoulder",
    activityName: "肩部和手臂活动",
    target: "慢速肩绕环：向后4–6圈、向前4–6圈；随后轻柔摆臂。全程不应夹痛或麻木。",
    steps: ["双脚与髋同宽，膝盖放松。", "肩膀先向上、向后、向下画小圈，再逐渐放大。", "手臂摆动来自肩关节，不甩手腕。"],
    mistakes: "耸肩憋气、快速甩臂，或把手臂硬拉到疼痛角度。",
    easier: "只做小幅肩胛骨后收和向下放松，手臂保持低于肩高。",
    visual: "shoulders",
  },
  {
    activityId: "warmup-hip",
    activityName: "髋部活动与髋折叠",
    target: "1分钟完成约8–12次慢速髋折叠；感觉大腿后侧轻微拉伸，而不是腰部受力。",
    steps: ["双脚与髋同宽，腹部轻收。", "膝盖微屈，臀部向后推，躯干随髋向前倾。", "保持腰背自然稳定，脚跟压地，再用臀部把身体带回直立。"],
    mistakes: "弓腰低头、膝盖大量向前，或为了下得更低而失去腰背稳定。",
    easier: "臀部只后移10–15厘米；面对墙站立或用手触碰椅背辅助。",
    visual: "hinge",
  },
  {
    activityId: "warmup-squat",
    activityName: "浅蹲与交替后撤步",
    target: "前30秒做6–10次浅蹲；后30秒左右交替后撤点地各6–10次。动作连续但不赶速度。",
    steps: ["浅蹲时臀部向后下方移动，膝盖朝脚尖方向。", "站起后，一只脚向后点地，重心主要留在前脚。", "左右交替，躯干保持稳定。"],
    mistakes: "膝盖向内扣、脚跟抬起，或后撤时把重心全部压到后脚。",
    easier: "浅蹲只下10–20厘米；后撤改为原地脚尖轻点，并扶住椅背。",
    visual: "squat-step",
  },
  {
    activityId: "warmup-step",
    activityName: "加速原地走与无跳开合步",
    target: "前30秒把原地走加到约100–110步/分；后30秒做左右各8–12次无跳开合步。仍能说完整句子。",
    steps: ["先加快原地走，但保持脚步轻。", "无跳开合步：右脚向右迈一步，同时双臂向外上方画弧。", "右脚收回、手臂落下；再换左脚，始终有一只脚接触地面。"],
    mistakes: "双脚同时离地、落脚过宽、膝盖锁死，或手臂上举导致耸肩。",
    easier: "侧迈距离缩小，手臂只抬到肩高；需要时不加速原地走。",
    visual: "step-jack",
  },
  {
    activityId: "core-wheel",
    activityName: "健腹轮",
    target: "30秒完成约5次。向前2–3秒、短暂停顿、回收约2秒；只推到腹部能维持腰背不下沉的位置。",
    steps: ["跪姿把前臂稳稳放在支撑垫上，臀部轻收，肋骨不要外翻。", "身体从膝盖到头部整体缓慢向前，先用短距离。", "回收时腹部持续绷紧，同时前臂向下、向后压支撑垫，配合背阔肌和肩带把身体拉回；不是只靠腹部。"],
    mistakes: "腰部塌下、只把手臂推出去、用臀部突然后坐，或在最远端停留到腰部发紧。",
    easier: "明显缩短距离，或改做仰卧死虫；腰部出现刺痛、放射痛或越来越重的酸痛应立即停止。",
    visual: "ab-wheel",
  },
  {
    activityId: "circuit-march",
    activityName: "原地快走或交替抬膝",
    target: "主观强度约5–6/10：呼吸明显加快，但还能说一个短句。步频可从110步/分左右开始，再按体感调整；不必刻意追求某个心率。",
    steps: ["躯干直立，腹部轻收。", "左右交替抬膝到舒适高度，脚掌轻落地。", "用自然摆臂提高强度，不用身体后仰换取抬膝高度。"],
    mistakes: "跺脚、屏住呼吸、身体后仰，或膝盖抬得太高导致腰部紧张。",
    easier: "降低膝盖高度和步频，改成脚尖交替点地。",
    visual: "high-knee",
  },
  {
    activityId: "circuit-squat",
    activityName: "徒手深蹲",
    target: "40秒完成约8–14次：下降约2秒，站起1–2秒。最后几次有用力感，但动作形状不变。",
    steps: ["双脚约与肩同宽，脚尖略向外。", "吸气，臀部向后下方移动，膝盖朝第二脚趾方向。", "脚掌三点压地，呼气站起，顶部不要猛顶腰。"],
    mistakes: "膝盖内扣、脚跟离地、含胸弓腰，或为了下得深而骨盆卷曲。",
    easier: "在身后放稳固椅子，轻触椅面后站起；也可减小下蹲深度。",
    visual: "squat",
  },
  {
    activityId: "circuit-box",
    activityName: "影子拳",
    target: "40秒做约40–60次轻快交替直拳。强度来自节奏和躯干轻微转动，不是用力锁肘。",
    steps: ["双脚一前一后或与肩同宽，膝盖放松。", "拳从下巴附近直线送出，另一手留在面前。", "拳到接近伸直就收回，配合呼气，肩膀保持下沉。"],
    mistakes: "肘部打直锁死、耸肩、只甩手臂，或转身过大扭到膝盖。",
    easier: "减慢到每秒约1拳，不转髋，只做小幅交替前伸。",
    visual: "boxing",
  },
  {
    activityId: "circuit-lunge",
    activityName: "交替后撤弓步",
    target: "40秒左右各做5–8次，优先保持平衡和膝盖方向，不追求后膝贴地。",
    steps: ["站直，一只脚向后迈到舒适距离。", "前脚掌稳稳压地，两膝弯曲，躯干保持直立。", "用前腿和臀部发力回到站姿，再换边。"],
    mistakes: "前膝内扣、步幅太窄像走钢丝、身体前扑，或后脚蹬地代替前腿发力。",
    easier: "改成后撤脚尖点地，不下蹲；或扶墙、扶椅背完成。",
    visual: "reverse-lunge",
  },
  {
    activityId: "circuit-jack",
    activityName: "无跳开合步",
    target: "40秒完成约20–30次左右交替侧迈。保持一只脚始终着地；呼吸加快但能说短句。",
    steps: ["站立，双臂自然下垂。", "右脚向右迈一步，同时双臂从侧面抬向头顶；右膝保持柔软。", "右脚收回、手臂落下，然后左侧重复。"],
    mistakes: "变成双脚跳跃、侧迈过宽、膝盖向内扣，或双臂上举时耸肩和塌腰。",
    easier: "侧迈缩小为脚尖点地，手臂只抬到胸口或肩高。",
    visual: "step-jack",
  },
  {
    activityId: "circuit-push",
    activityName: "墙壁俯卧撑",
    target: "40秒完成约8–15次：靠近墙约2秒，推开1–2秒。最后几次有挑战，但腰背仍保持一条直线。",
    steps: ["双手略宽于肩放在墙上，双脚后移到身体倾斜。", "收紧腹部和臀部，肘部向斜后方弯曲，胸口靠近墙。", "手掌推墙回到起点，肘部保留一点弯曲。"],
    mistakes: "塌腰、头先碰墙、肘部完全张成一条横线，或推起时锁死肘部。",
    easier: "双脚向墙靠近；更难则把脚后移，但先保证身体稳定。",
    visual: "wall-pushup",
  },
  {
    activityId: "cooldown-walk",
    activityName: "原地慢走与呼吸",
    target: "从约90步/分逐渐降到70–80步/分，直到能轻松说完整句子，呼吸明显平稳。",
    steps: ["继续小步走，不要突然停下。", "逐渐减小摆臂和步幅。", "鼻吸口呼或自然呼吸，避免刻意深吸到头晕。"],
    mistakes: "训练结束立刻站死、憋气，或强迫自己做过深过快的呼吸。",
    easier: "扶住稳固物体，以更小的步幅慢慢走。",
    visual: "slow-march",
  },
  {
    activityId: "cooldown-calf",
    activityName: "小腿拉伸",
    target: "左右各约30秒，感觉小腿后侧温和牵拉，强度约3–4/10，不应疼痛或麻木。",
    steps: ["双手扶墙，一脚向后迈。", "后脚脚尖朝前、脚跟压地，前膝微屈。", "身体整体向墙靠近，保持后腿膝盖伸直但不锁死。"],
    mistakes: "后脚外八、脚跟抬起、弹振拉伸，或为了更深而塌腰。",
    easier: "缩短前后脚距离，减少身体前倾。",
    visual: "calf-stretch",
  },
  {
    activityId: "cooldown-hip",
    activityName: "大腿前侧或髋前侧拉伸",
    target: "选择更舒服的一种，左右各约30秒。保持温和牵拉，不要同时追求很大幅度。",
    steps: ["大腿前侧：扶墙，屈膝握住脚踝或裤脚，双膝靠近，骨盆轻收。", "如果屈膝不舒服：改成小幅后撤弓步，后腿髋部轻轻向前。", "全程站稳，不屏气。"],
    mistakes: "拉脚把腰拱起、膝盖向外张，或单脚站立摇晃仍坚持。",
    easier: "用毛巾绕住脚踝，或完全改做扶墙后撤步髋前侧拉伸。",
    visual: "quad-stretch",
  },
  {
    activityId: "cooldown-chest",
    activityName: "胸部和肩部放松",
    target: "做小幅肩绕环后，保持胸前侧温和舒展20–30秒；肩关节内不应夹痛。",
    steps: ["站直，肩膀先向后下方放松。", "双手在身后轻轻相握，或把手放在后腰。", "胸骨轻抬，手臂只向后移动一点，不需要抬高。"],
    mistakes: "挺胸变成塌腰、耸肩，或把手臂硬拉得过高。",
    easier: "不握手，只做肩胛骨轻轻后收5秒，再放松。",
    visual: "chest-open",
  },
  {
    activityId: "cooldown-check",
    activityName: "站立呼吸与身体检查",
    target: "站稳后做4–6次安静呼吸；能够完整说话，确认没有胸闷、头晕、异常心悸或越来越重的腰痛。",
    steps: ["一手放胸前、一手放腹部，放松下巴和肩膀。", "舒适地吸气约3–4秒，呼气约4–6秒，不必憋气。", "从头到脚检查是否有异常疼痛或不稳。"],
    mistakes: "刻意大口吸气导致头晕，或把明显不适当成正常训练反应。",
    easier: "如果站立不稳就坐下呼吸；出现胸痛、明显气短、晕厥感或神经症状应停止并及时求助。",
    visual: "breathing",
  },
];

export function findExerciseGuide(activityId: string, activityName: string) {
  const normalizedName = activityName.replace(/－副本(?:－副本)*$/, "");
  return EXERCISE_GUIDES.find((guide) => guide.activityId === activityId)
    ?? EXERCISE_GUIDES.find((guide) => guide.activityName === normalizedName);
}
