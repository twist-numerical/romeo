import * as twgl from "twgl.js";

export type Color = [number, number, number];

const interpolationSteps = 12;

function lerp(a: number, b: number, v: number) {
  return b * v + a * (1 - v);
}

export const colorSchemes: { [name: string]: ColorScheme } = {};

function parseColor(color: string | Color): Color {
  if (typeof color == "string") {
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

  get uniforms() {
    if (!this._uniformCache) {
      const uc: number[] = [];
      for (let i = 0; i <= interpolationSteps; ++i)
        uc.push(...this.get(i / interpolationSteps));
      this._uniformCache = uc;
    }
    return {
      uColorScheme: this._uniformCache,
      uColorSchemeNegative: this.negative,
      uColorSchemeAxes: this.axes,
    };
  }

  static glslCode: string = (() => {
    let code = `uniform vec3 uColorScheme[${interpolationSteps + 1}];`;
    code += `uniform vec3 uColorSchemeNegative;`;
    code += `uniform vec3 uColorSchemeAxes;`;
    code += `vec3 colorScheme(float v) {`;
    code += `if(v < 0.0) return uColorSchemeNegative;`;
    code += `v = fract(v) * float(${interpolationSteps});`;
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

createScheme("UGent", [
  "1E64C8",
  "71A860",
  "FFD200",
  "F1A42B",
  "DC4E28",
  "825491",
]);
createScheme("Rainbow", [
  "ff7f00",
  "7fff00",
  "00ff7f",
  "007fff",
  "7f00ff",
  "ff007f",
]);
createScheme("Gray", ["FFFFFF", "999999"], "000000", "777777");
createScheme(
  "Pink",
  ["91589C", "B26AA6", "C87DA2", "D28AC6", "D198DB"],
  "FF7BE2"
);
createScheme(
  "Hot and cold",
  [
    [0.2298057, 0.298717966, 0.753683153],
    [0.865395197, 0.86541021, 0.865395561],
    [0.705673158, 0.01555616, 0.150232812],
    [0.865395197, 0.86541021, 0.865395561],
  ],
  "000000"
);
