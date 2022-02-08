export type Color = [number, number, number];

const maxInterpolationSteps = 17;

function lerp(a: number, b: number, v: number) {
  return b * v + a * (1 - v);
}

export const colorSchemes: { [name: string]: ColorScheme } = {};

function parseColor(color: string | Color): Color {
  if (typeof color == "string") {
    if (color.startsWith("#")) color = color.substring(1);
    const n = +("0x" + color);
    return [
      ((n >> 16) & 0xff) / 0xff,
      ((n >> 8) & 0xff) / 0xff,
      ((n >> 0) & 0xff) / 0xff,
    ];
  } else return color;
}

export default class ColorScheme {
  readonly steps: Color[];
  readonly negative: Color;
  readonly axes: Color;
  private _uniformCache: number[] | undefined = undefined;

  constructor(
    readonly name: string,
    _steps: (string | Color)[],
    _negative: string | Color = [0, 0, 0],
    _axes: string | Color = [1, 1, 1]
  ) {
    this.steps = _steps.map(parseColor);
    this.negative = parseColor(_negative);
    this.axes = parseColor(_axes);
  }

  get(v: number): Color {
    v = (v * this.steps.length) % this.steps.length;
    const i = Math.floor(v) % this.steps.length;
    const a = this.steps[i];
    const b = this.steps[(i + 1) % this.steps.length];
    const f = v - i;
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
  }

  get interpolationSteps() {
    return Math.min(maxInterpolationSteps, this.steps.length);
  }

  get uniforms() {
    if (!this._uniformCache) {
      const uc: number[] = [];
      for (let i = 0; i <= this.interpolationSteps; ++i)
        uc.push(...this.get(i / this.interpolationSteps));
      this._uniformCache = uc;
    }
    return {
      uColorScheme: this._uniformCache,
      uColorSchemeNegative: this.negative,
      uColorSchemeAxes: this.axes,
      uColorSchemeSteps: this.interpolationSteps,
    };
  }

  static glslCode: string = (() => {
    let code = `uniform vec3 uColorScheme[${maxInterpolationSteps + 1}];`;
    code += `uniform vec3 uColorSchemeNegative;`;
    code += `uniform vec3 uColorSchemeAxes;`;
    code += `uniform int uColorSchemeSteps;`;
    code += `vec3 colorScheme(float v) {`;
    code += `if(v < 0.0) return uColorSchemeNegative;`;
    code += `v = fract(v) * float(uColorSchemeSteps);`;
    code += `int i = int(v);`;
    code += `return mix(uColorScheme[i], uColorScheme[i + 1], v - float(i));`;
    code += `}`;
    return code;
  })();

  static schemes = colorSchemes;

  static randomScheme() {
    const keys = Object.keys(this.schemes);
    return this.schemes[keys[Math.floor(Math.random() * keys.length)]];
  }
}

type ColorArg = Color | string;
function createScheme(
  name: string,
  colors: ColorArg[],
  negative?: ColorArg,
  axes?: ColorArg
) {
  colorSchemes[name] = new ColorScheme(name, colors, negative, axes);
}

function bidirectional(r: ColorArg[]): ColorArg[] {
  const a = [...r];
  a.push(...r.slice(1, -1).reverse());
  return a;
}

createScheme("UGent", [
  "#1E64C8",
  "#71A860",
  "#FFD200",
  "#F1A42B",
  "#DC4E28",
  "#825491",
]);
createScheme("Fluo", [
  "#ff7f00",
  "#7fff00",
  "#00ff7f",
  "#007fff",
  "#7f00ff",
  "#ff007f",
]);
createScheme("Gray", ["#FFFFFF", "#999999"], "#000000", "#777777");

createScheme(
  "Hot and cold",
  bidirectional([
    [0.2298057, 0.298717966, 0.753683153],
    [0.865395197, 0.86541021, 0.865395561],
    [0.705673158, 0.01555616, 0.150232812],
  ]),
  "#000000"
);
createScheme(
  "Soft rainbow",
  ([
    "#2EC7F1",
    "#8669B4",
    "#E43140",
    "#F0D43A",
    "#34C74C",
  ]),
  "#000000"
);
createScheme(
  "Dracula",
  bidirectional([
    "#384259",
    "#F73859",
    "#7AC7C4",
    "#C4EDDE",
  ]),
  "#000000"
);
createScheme(
  "Candy",
  bidirectional([
    "#6092CA",
    "#3FC1C9",
    "#FCE38A",
    "#FC5185"
  ]),
  "#000000"
);
createScheme(
  "Christmas",
  bidirectional(["#FA4659", "#FEFFE4", "#A3DE83", "#2EB872"]),
  "#413131"
);
createScheme(
  "Autumn",
  [
    "#306BC5",
    "#14a6a5",
    "#59cf85",
    "#D8E74A",
    "#CCA940",
    "#F3D89F",
    "#A5D82D",
    "#71CFC3",
  ],
  "#000000"
);
