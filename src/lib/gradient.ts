import Color from "color";

function getColor(value: number, gradient1: string, gradient2: string): string {
  const color1 = Color(gradient1);
  const color2 = Color(gradient2);
  const interpolatedColor = color1.mix(color2, value);
  return interpolatedColor.hex();
}

export default getColor;
