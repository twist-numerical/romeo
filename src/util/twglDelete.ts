import * as twgl from "twgl.js";

export function deleteFramebuffer(
  gl: WebGL2RenderingContext,
  fbi: twgl.FramebufferInfo
) {
  gl.deleteFramebuffer(fbi.framebuffer);
  for (const attachment of fbi.attachments) {
    if (attachment instanceof WebGLRenderbuffer) {
      gl.deleteRenderbuffer(attachment);
    } else {
      gl.deleteTexture(attachment);
    }
  }
}

export function deleteBuffer(
  gl: WebGL2RenderingContext,
  bufferInfo: twgl.BufferInfo
) {
  if (bufferInfo.attribs)
    for (const attrib of Object.values(bufferInfo.attribs)) {
      gl.deleteBuffer(attrib.buffer);
    }
  if (bufferInfo.indices) {
    gl.deleteBuffer(bufferInfo.indices);
  }
}
