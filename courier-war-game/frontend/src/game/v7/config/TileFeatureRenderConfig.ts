// Defines renderer-only geometry values for tile features
export const tileFeatureRenderConfig = {
  // Groups Courier start marker drawing values
  startMarker: {
    glowAlpha: 0.22,
    glowRadiusPixels: 15,
    glowYOffsetPixels: -8,

    coreAlpha: 1,
    coreRadiusPixels: 8,
    coreYOffsetPixels: -10,

    coreOutlineWidthPixels: 3,
    coreOutlineAlpha: 0.95,

    stemLineWidthPixels: 2,
    stemAlpha: 0.9,
    stemStartYOffsetPixels: -1,
    stemEndYOffsetPixels: 9,
  },

  // Groups delivery flag drawing values
  deliveryMarker: {
    glowAlpha: 0.2,
    glowRadiusPixels: 16,
    glowYOffsetPixels: -7,

    flagAlpha: 1,
    flagPointA: { xOffsetPixels: -7, yOffsetPixels: -22 },
    flagPointB: { xOffsetPixels: 11, yOffsetPixels: -15 },
    flagPointC: { xOffsetPixels: -7, yOffsetPixels: -8 },

    flagOutlineWidthPixels: 2,
    flagOutlineAlpha: 0.95,

    poleLineWidthPixels: 3,
    poleAlpha: 0.9,
    poleXOffsetPixels: -7,
    poleStartYOffsetPixels: -22,
    poleEndYOffsetPixels: 8,
  },

  // Groups traffic signal drawing values
  trafficSignal: {
    xOffsetPixels: 4,

    glowAlpha: 0.18,
    glowRadiusPixels: 10,
    glowYOffsetPixels: -11,

    poleLineWidthPixels: 2,
    poleAlpha: 0.82,
    poleTopYOffsetPixels: -5,
    poleBottomYOffsetPixels: 5,

    bodyAlpha: 1,
    bodyXOffsetPixels: -1,
    bodyYOffsetPixels: -20,
    bodyWidthPixels: 10,
    bodyHeightPixels: 15,
    bodyRadiusPixels: 3,

    bodyOutlineWidthPixels: 1,
    bodyOutlineAlpha: 0.9,

    lensInactiveColorHex: "#061016",
    lensInactiveAlpha: 0.9,
    lensRadiusPixels: 2,
    activeLensRadiusPixels: 2.4,
    lensYOffsetListPixels: [-16, -12, -8],
    redLensIndex: 0,
    greenLensIndex: 2,
  },

  // Groups tunnel entrance drawing values
  tunnelEntrance: {
    glowAlpha: 0.18,
    glowRadiusPixels: 12,
    glowYOffsetPixels: -4,

    archLineWidthPixels: 3,
    archAlpha: 0.95,
    archXOffsetPixels: -8,
    archYOffsetPixels: -13,
    archWidthPixels: 16,
    archHeightPixels: 13,
    archRadiusPixels: 7,

    baseLineWidthPixels: 2,
    baseLineAlpha: 0.55,
    baseLineLeftXOffsetPixels: -8,
    baseLineRightXOffsetPixels: 8,
    baseLineYOffsetPixels: -1,
  },

  // Groups shortcut entrance drawing values
  shortcutEntrance: {
    glowAlpha: 0.2,
    glowRadiusPixels: 10,
    glowYOffsetPixels: -3,

    triangleAlpha: 0.95,
    trianglePointA: { xOffsetPixels: 0, yOffsetPixels: -10 },
    trianglePointB: { xOffsetPixels: -7, yOffsetPixels: 4 },
    trianglePointC: { xOffsetPixels: 7, yOffsetPixels: 4 },

    outlineColorHex: "#ffffff",
    outlineLineWidthPixels: 1,
    outlineAlpha: 0.75,
  },

  // Groups bridge entrance drawing values
  bridgeEntrance: {
    lineWidthPixels: 3,
    lineAlpha: 0.95,
    lineLeftXOffsetPixels: -8,
    lineRightXOffsetPixels: 8,
    topLineYOffsetPixels: -4,
    bottomLineYOffsetPixels: 4,

    glowAlpha: 0.28,
    glowRadiusPixels: 8,
  },
} as const;