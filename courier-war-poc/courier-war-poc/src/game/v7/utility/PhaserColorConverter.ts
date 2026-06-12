// Converts editable hex color strings into Phaser numeric colors
export function phaserColorNumberFromHexGet(colorHex: string): number {
  // Stores color text after removing surrounding spaces
  const colorHexTrimmed = colorHex.trim();

  // Stores color text without the leading hash character
  const colorHexWithoutHash = colorHexTrimmed.startsWith("#")
    ? colorHexTrimmed.slice(1)
    : colorHexTrimmed;

  // Checks that the color has exactly six hexadecimal characters
  const colorHexValid = /^[0-9a-fA-F]{6}$/.test(colorHexWithoutHash);

  // Stops conversion when the color format is invalid
  if (!colorHexValid) {
    // Throws a clear error for invalid visual configuration
    throw new Error(`Invalid hex color value ${colorHex}`);
  }

  // Converts the hexadecimal color string into a Phaser number
  return Number.parseInt(colorHexWithoutHash, 16);
}

// Converts editable hex color strings into CSS color strings
export function phaserColorCssFromHexGet(colorHex: string): string {
  // Stores color text after removing surrounding spaces
  const colorHexTrimmed = colorHex.trim();

  // Stores color text with a leading hash character
  const colorHexWithHash = colorHexTrimmed.startsWith("#")
    ? colorHexTrimmed
    : `#${colorHexTrimmed}`;

  // Checks that the color has valid CSS hex format
  const colorHexValid = /^#[0-9a-fA-F]{6}$/.test(colorHexWithHash);

  // Stops conversion when the color format is invalid
  if (!colorHexValid) {
    // Throws a clear error for invalid visual configuration
    throw new Error(`Invalid CSS hex color value ${colorHex}`);
  }

  // Returns the normalized CSS hex color
  return colorHexWithHash;
}