import * as math from "mathjs";

const binary_functions: { [f: string]: string } = {
  add: "return a + b;",
  subtract: "return a - b;",
  multiply: "return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);",
  divide:
    "return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / dot(b, b);",
  pow: "return c_exp(c_multiply(b, c_log(a)));",
};

const unary_functions: { [f: string]: string } = {
  inverse: "return vec2(a.x, -a.y)/dot(a, a);",
  unaryMinus: "return -a;",
  multiply_i: "return vec2(-a.y, a.x);",
  log: "return vec2(log(length(a)), atan(a.y, a.x));",
  exp: "return exp(a.x)*vec2(cos(a.y), sin(a.y));",
  sinh: "vec2 epa = c_exp(a); return .5 * (epa - c_inverse(epa));",
  cosh: "vec2 epa = c_exp(a); return .5 * (epa + c_inverse(epa));",
  tanh: "vec2 epa = c_exp(a); vec2 ema = c_inverse(epa); return c_divide(epa - ema, epa + ema);",
  sin: "return -c_multiply_i(c_sinh(c_multiply_i(a)));",
  cos: "return c_cosh(c_multiply_i(a));",
  tan: "return -c_multiply_i(c_tanh(c_multiply_i(a)));",
  sqrt: "return c_exp(0.5*c_log(a));",
  cbrt: "return c_exp(0.33333333333*c_log(a));",
};

const symbols: { [symbol: string]: string } = {
  i: "vec2(0.,1.)",
  e: "vec2(2.7182818284,0.)",
  pi: "vec2(3.14159265358,0.)",
  phi: "vec2(1.6180339887, 0.)",
};

[
  ["sin", "csc"],
  ["cos", "sec"],
  ["tan", "cot"],
].forEach(([func, cofunc]) => {
  unary_functions[cofunc] = `return c_inverse(c_${func}(a));`;
  unary_functions[cofunc + "h"] = `return c_inverse(c_${func}h(a));`;
});

const complex_functions: {
  [f: string]: { body: string; args: number; order: number };
} = {};

Object.entries(unary_functions).forEach(
  ([f, body]) => (complex_functions[f] = { body, args: 1, order: 0 })
);
Object.entries(binary_functions).forEach(
  ([f, body]) => (complex_functions[f] = { body, args: 2, order: 0 })
);

complex_functions.divide.order = 100;
complex_functions.multiply.order = 100;
complex_functions.multiply_i.order = 100;
complex_functions.log.order = 100;
complex_functions.exp.order = 100;
complex_functions.inverse.order = 100;
["sin", "cos", "tan"].forEach((f) => {
  complex_functions[f + "h"].order = 20;
  complex_functions[f].order = 10;
});

function compileTree(tree: math.MathNode, vars: string[]): string {
  if (tree instanceof math.SymbolNode) {
    if (symbols[tree.name] !== undefined) return symbols[tree.name];
    if (vars.indexOf(tree.name) == -1)
      throw new SyntaxError("Invalid symbol name: '" + tree.name + "'");
    return tree.name;
  } else if (
    tree instanceof math.FunctionNode ||
    tree instanceof math.OperatorNode
  ) {
    const name = tree instanceof math.FunctionNode ? tree.fn.name : tree.fn;
    if (complex_functions[name] === undefined)
      throw new SyntaxError(`Invalid function name: '${name}'`);
    let f = `c_${name}(`;
    for (let i = 0; i < tree.args.length; ++i) {
      if (i > 0) f += ",";
      f += compileTree(tree.args[i], vars);
    }
    f += ")";
    return f;
  } else if (tree instanceof math.ConstantNode) {
    const v = tree.value;
    return `vec2(${v}, 0)`;
  } else if (tree instanceof math.ParenthesisNode) {
    return compileTree(tree.content, vars);
  } else {
    throw new SyntaxError("Unknown node: " + tree);
  }
}

export function compile(expr: math.MathNode, vars = ["z"]): string {
  return compileTree(expr, vars);
}

export const shaderHeader = Object.entries(complex_functions)
  .map<[number, string]>(([name, { body, args, order }]) => [
    order,
    `vec2 c_${name}(vec2 a${args == 2 ? ", vec2 b" : ""}){ ${body} }`,
  ])
  .sort((a, b) => b[0] - a[0])
  .map(([_, a]) => a)
  .join("\n");
