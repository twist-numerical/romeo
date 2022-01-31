<template lang="pug">
ComplexPlane(
  :shader="srcShader3",
  ref="complexPlane",
  :uniforms="uniforms",
  :shouldRender="() => true",
  @beforeRender="onBeforeRender",
  @afterRender="onAfterRender",
  @resize="onResize"
)
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import { defineComponent } from "vue";
import ComplexPlane, { complexPlaneShaderHeader } from "./ComplexPlane.vue";
import ColorScheme from "../util/ColorScheme";
import SquareShader from "@/util/SquareShader";

type CPlane = InstanceType<typeof ComplexPlane>;

const STEPS_PER_STAGE = 200;
const MAX_STEPS = 10000;

const srcShader1 =
  complexPlaneShaderHeader +
  `
out vec4 oOutput;

void main() {
  oOutput.rg = point();
  oOutput.b = 0.0;
  oOutput.a = 0.0;
}`;

const srcShader2 = `
#define MAXSTEPS ${STEPS_PER_STAGE}

uniform sampler2D uInput;
out vec4 oOutput;

uniform vec2 c;

vec2 cMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

float cMod(vec2 a) {
  return length(a);
}

void main() {
  vec4 t = texture(uInput, vPixel);
  vec2 z = t.rg;

  float steps = t.b;
  for(int i = 0; i < MAXSTEPS; ++i) {
    if(cMod(z) > 2.0) {
      break;
    }
    steps += 1.0;
    z = cMul(z, z) + c;
  }
  oOutput.rg = z;
  oOutput.b = steps;
}`;

const srcShader3 =
  ColorScheme.glslCode +
  `
uniform sampler2D uInput;
out vec4 oColor;

vec3 color(float steps) {
  return colorScheme(steps/60.0);
}

void main() {
  vec4 t = texture(uInput, vPixel);
  vec2 z = t.rg;
  float steps = t.b;

  oColor= vec4(color(length(z) < 2.0 ? -1.0 : steps), 1.0);
}`;

export default defineComponent({
  components: { ComplexPlane },
  props: {
    colorScheme: {
      type: String,
      default: "rainbow",
    },
    c: {
      type: Array,
      default: [-0.8, 0.156],
    },
  },
  data() {
    return {
      srcShader3: srcShader3,
      context: null as WebGL2RenderingContext | null,
      framebuffers: [] as twgl.FramebufferInfo[],
      squareShaders: [] as SquareShader[],
      stepsExecuted: 0,
      largeImage: false,
    };
  },
  computed: {
    uniforms() {
      return {
        ...ColorScheme.schemes[this.colorScheme].uniforms,
        c: this.c,
        input: this.framebuffers[0]
          ? this.framebuffers[0].attachments[0]
          : null,
      };
    },
    framebufferAttachments(): twgl.AttachmentOptions[] {
      const gl = this.context;
      if (!gl) return [];
      return [
        {
          format: gl.RGBA,
          type: gl.FLOAT,
          internalFormat: gl.RGBA32F,
          minMag: gl.NEAREST,
        },
      ];
    },
  },
  methods: {
    initGL(plane: CPlane) {
      const gl = plane.context;
      if (!gl) return;
      if (this.context !== gl) this.context = gl;

      this.framebuffers = [0, 1].map(() => {
        return twgl.createFramebufferInfo(gl, this.framebufferAttachments);
      });

      this.squareShaders = [
        new SquareShader(gl, srcShader1),
        new SquareShader(gl, srcShader2),
      ];
    },
    render1(plane: CPlane) {
      const gl = this.context as WebGL2RenderingContext;
      const shader = this.squareShaders[0];
      shader.useProgram();
      twgl.setUniforms(shader.programInfo, plane.zoomUniforms);
      twgl.bindFramebufferInfo(gl, this.framebuffers[0]);
      shader.draw();
      this.stepsExecuted = 0;
    },
    render2(plane: CPlane) {
      const gl = this.context as WebGL2RenderingContext;
      const shader = this.squareShaders[1];
      gl.flush();
      gl.finish();
      const start = performance.now();
      let i = 0;

      const singleStage = () => {
        [0, 1].forEach((i) => {
          shader.useProgram();
          twgl.setUniforms(shader.programInfo, {
            c: this.c,
            uInput: this.framebuffers[i].attachments[0],
          });
          twgl.bindFramebufferInfo(gl, this.framebuffers[1 - i]);
          shader.draw();
        });
      };

      if (this.largeImage) {
        for (let i = 0; i < MAX_STEPS; i += STEPS_PER_STAGE) {
          singleStage();
        }
      } else {
        do {
          ++i;
          singleStage();
          this.stepsExecuted += STEPS_PER_STAGE;
          gl.flush();
          gl.finish();
        } while (performance.now() - start < 5 && i < 5);
      }
    },
    onBeforeRender(plane: CPlane) {
      if (this.largeImage) console.log("Render large");
      if (this.context !== plane.context) this.initGL(plane);
      if (plane.needsUpdate) {
        this.render1(plane);
      }
      if (this.stepsExecuted < MAX_STEPS) this.render2(plane);
      // console.log("Before render");
    },
    onAfterRender(plane: CPlane) {
      // console.log("Render done");
    },
    onResize(width: number, height: number) {
      const gl = this.context;
      if (!gl) return;
      this.framebuffers.forEach((f) =>
        twgl.resizeFramebufferInfo(
          gl,
          f,
          this.framebufferAttachments,
          width,
          height
        )
      );
    },
    resetView() {
      (this.$refs.complexPlane as any).resetView();
    },
    async generateImage(size: number): Promise<ImageData> {
      this.largeImage = true;
      const img = await (this.$refs.complexPlane as CPlane).generateImage(size);
      this.largeImage = false;
      return img;
    },
  },
});
</script>
