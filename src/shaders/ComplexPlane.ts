type vec2 = [number, number];

export default class ComplexPlane {
  static header = `uniform vec2 zoom;
    uniform vec2 center;
    
    vec2 point() {
      return center + zoom * (vPixel - 0.5);
    }`;

  center: vec2 = [0, 0];
  zoom: number = 3;
  size: vec2 = [100, 100];

  get vmin() {
    return Math.min(this.size[0], this.size[1]);
  }

  get uniforms() {
    const [width, height] = this.size;
    const f = this.scaleFactor;

    return {
      center: this.center,
      zoom: [f * width, f * height],
    };
  }

  get scaleFactor() {
    return this.zoom / this.vmin;
  }
}
