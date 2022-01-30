import * as twgl from "twgl.js";

export type Color = [number, number, number];

const interpolationSteps = 12;

function lerp(a: number, b: number, v: number) {
  return b * v + a * (1 - v);
}

export const colorSchemes: { [name: string]: ColorScheme } = {};

export default class ColorScheme {
  readonly steps: Color[] = [];
  private _uniformCache: number[] | undefined = undefined;

  constructor(_steps: string[]) {
    _steps.forEach((s) => {
      const n = +("0x" + s);
      this.steps.push([
        ((n >> 16) & 0xff) / 0xff,
        ((n >> 8) & 0xff) / 0xff,
        ((n >> 0) & 0xff) / 0xff,
      ]);
    });
  }

  get(v: number): Color {
    v = (v * this.steps.length) % this.steps.length;
    const i = Math.floor(v) % this.steps.length;
    const a = this.steps[i];
    const b = this.steps[(i + 1) % this.steps.length];
    const f = v - i;
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
  }

  setUniforms(programInfo: twgl.ProgramInfo) {
    if (!this._uniformCache) {
      const uc: number[] = [];
      for (let i = 0; i <= interpolationSteps; ++i)
        uc.push(...this.get(i / interpolationSteps));
      this._uniformCache = uc;
    }
    twgl.setUniforms(programInfo, { uColorScheme: this._uniformCache });
  }

  static glslCode: string = (() => {
    let code = `uniform vec3 uColorScheme[${interpolationSteps + 1}];`;
    code += `vec3 colorScheme(float v) {`;
    code += `v = fract(v) * float(${interpolationSteps});`;
    code += `int i = int(v);`;
    code += `return mix(uColorScheme[i], uColorScheme[i + 1], v - float(i));`;
    code += `}`;
    return code;
  })();

  static schemes = colorSchemes;
}

colorSchemes["UGent"] = new ColorScheme([
  "1E64C8",
  "71A860",
  "FFD200",
  "F1A42B",
  "DC4E28",
  "825491",
]);
colorSchemes["Rainbow"] = new ColorScheme([
  "ff7f00",
  "7fff00",
  "00ff7f",
  "007fff",
  "7f00ff",
  "ff007f",
]);
colorSchemes["Gray"] = new ColorScheme(["FFFFFF", "999999"]);
