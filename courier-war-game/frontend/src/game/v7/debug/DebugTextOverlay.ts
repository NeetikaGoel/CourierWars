// this file shows a prototype-only debug hud as a dom side panel next to the phaser canvas
// it only reads runtime state, so no gameplay logic depends on it
// debug text can reveal hidden information (tunnels, shortcuts), so it stays off in final builds

import { debugDisplayConfig } from "../config/DebugDisplayConfig";
import type { CityMapGenerated, CityTile } from "../types/CityMapType";
import type { CoordinateTilePoint } from "../types/CoordinateType";
import type { MatchPrototypeStateShape } from "../types/MatchRuntimeStateType";
import { TrafficSignalStateName } from "../types/TrafficSignalType";

// this id keeps a single panel even if the scene is restarted
const DEBUG_PANEL_ELEMENT_ID = "cw-debug-text-overlay";

// this limits dom rewrites to a few per second instead of every frame
const DEBUG_UPDATE_INTERVAL_MS = 200;

interface DebugRow {
  label: string;
  value: string;
  colorHex?: string;
}

interface DebugSection {
  title: string;
  rowList: DebugRow[];
}

export class DebugTextOverlay {
  // this stores generated map used to look up tiles and zones
  private readonly cityMapGenerated: CityMapGenerated;

  // this stores mutable runtime state shared with the scene
  private readonly matchPrototypeState: MatchPrototypeStateShape;

  // this stores the panel element, null when hud is disabled or cleared
  private panelElement: HTMLDivElement | null = null;

  // this stores last render time for throttling
  private lastUpdatedAtMs = Number.NEGATIVE_INFINITY;

  // this stores last rendered html so unchanged frames skip dom writes
  private lastRenderedHtml = "";

  constructor(cityMapGenerated: CityMapGenerated, matchPrototypeState: MatchPrototypeStateShape) {
    this.cityMapGenerated = cityMapGenerated;
    this.matchPrototypeState = matchPrototypeState;
  }

  debugTextCreate(currentTimeMs: number): void {
    // this does nothing when debug hud is disabled in config
    if (!debugDisplayConfig.sidePanel.visible || typeof document === "undefined") {
      return;
    }

    // this removes a panel left behind by a previous scene instance
    document.getElementById(DEBUG_PANEL_ELEMENT_ID)?.remove();

    const sidePanel = debugDisplayConfig.sidePanel;
    const panelElement = document.createElement("div");
    panelElement.id = DEBUG_PANEL_ELEMENT_ID;
    Object.assign(panelElement.style, {
      position: "fixed",
      top: `${sidePanel.topPixels}px`,
      right: `${sidePanel.rightPixels}px`,
      width: `${sidePanel.widthPixels}px`,
      height: sidePanel.heightCss,
      zIndex: String(sidePanel.zIndex),
      boxSizing: "border-box",
      overflowY: "auto",
      padding: `${sidePanel.paddingPixels}px`,
      background: sidePanel.backgroundColorHex,
      color: sidePanel.textColorHex,
      borderLeft: `1px solid ${sidePanel.borderColorHex}`,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: `${sidePanel.fontSizePixels}px`,
      lineHeight: "1.45",
      pointerEvents: "none",
    } satisfies Partial<CSSStyleDeclaration>);

    document.body.appendChild(panelElement);
    this.panelElement = panelElement;

    // this renders first values immediately
    this.lastUpdatedAtMs = Number.NEGATIVE_INFINITY;
    this.debugTextUpdate(currentTimeMs);
  }

  debugTextUpdate(currentTimeMs: number): void {
    // this skips work when hud is disabled or throttled
    if (!this.panelElement || currentTimeMs - this.lastUpdatedAtMs < DEBUG_UPDATE_INTERVAL_MS) {
      return;
    }
    this.lastUpdatedAtMs = currentTimeMs;

    const html = this.debugHtmlBuild(this.debugSectionListBuild(currentTimeMs));
    if (html !== this.lastRenderedHtml) {
      this.panelElement.innerHTML = html;
      this.lastRenderedHtml = html;
    }
  }

  debugTextClear(): void {
    // this removes the panel and resets render cache
    this.panelElement?.remove();
    this.panelElement = null;
    this.lastRenderedHtml = "";
  }

  private debugSectionListBuild(currentTimeMs: number): DebugSection[] {
    const sidePanel = debugDisplayConfig.sidePanel;
    const state = this.matchPrototypeState;
    const courierTile = this.debugTileGet(state.courier.tilePoint);
    const hoveredTilePoint = state.tileInteraction.tilePointHovered;
    const hoveredTile = hoveredTilePoint ? this.debugTileGet(hoveredTilePoint) : null;
    const placementResult = state.tileInteraction.hoverPlacementResult;

    // this counts red traffic signals for a quick signal overview
    const trafficSignalStateList = Object.values(state.trafficSignalStateById);
    const trafficSignalRedCount = trafficSignalStateList.filter(
      (trafficSignalState) => trafficSignalState.stateName === TrafficSignalStateName.Red
    ).length;

    // this shows the hovered tile's own signal state when it has one
    const hoveredSignalState = hoveredTile?.trafficSignalId
      ? state.trafficSignalStateById[hoveredTile.trafficSignalId]
      : undefined;

    const cooldownUntilMs = state.saboteur.hurdleCooldownUntilMsByType[state.saboteur.hurdleTypeSelected];
    const cooldownRemainingMs = cooldownUntilMs ? Math.max(0, cooldownUntilMs - currentTimeMs) : 0;

    return [
      {
        title: "Match",
        rowList: [
          { label: "role", value: state.playerRole, colorHex: sidePanel.warningColorHex },
          { label: "map seed", value: String(state.mapSeed) },
          { label: "map size", value: `${this.cityMapGenerated.widthTiles} x ${this.cityMapGenerated.heightTiles}` },
          { label: "elapsed", value: `${Math.floor((Date.now() - state.matchStartedAtMs) / 1000)} s` },
        ],
      },
      {
        title: "Courier",
        rowList: [
          { label: "tile", value: this.debugPointFormat(state.courier.tilePoint) },
          { label: "zone", value: state.courier.zoneIdCurrent },
          { label: "previous zone", value: state.courier.zoneIdPrevious ?? "-" },
          { label: "direction", value: state.courier.directionName },
          { label: "lives", value: String(state.courier.livesCurrent) },
          { label: "visited tiles", value: String(state.courierVisitedTileKeySet.size) },
          ...this.debugTileRowListBuild(courierTile),
        ],
      },
      {
        title: "Hovered tile",
        rowList: hoveredTilePoint
          ? [
              { label: "tile", value: this.debugPointFormat(hoveredTilePoint) },
              { label: "zone", value: hoveredTile?.zoneId ?? "-" },
              ...this.debugTileRowListBuild(hoveredTile),
              ...(hoveredSignalState
                ? [{ label: "signal", value: hoveredSignalState.stateName, colorHex: this.debugSignalColorGet(hoveredSignalState.stateName) }]
                : []),
            ]
          : [{ label: "tile", value: "-", colorHex: sidePanel.mutedTextColorHex }],
      },
      {
        title: "Saboteur",
        rowList: [
          { label: "selected hurdle", value: state.saboteur.hurdleTypeSelected },
          { label: "energy", value: `${state.saboteur.energyCurrent} / ${state.saboteur.energyMax}` },
          { label: "cooldown", value: cooldownRemainingMs > 0 ? `${(cooldownRemainingMs / 1000).toFixed(1)} s` : "ready" },
          {
            label: "placement",
            value: placementResult ? (placementResult.valid ? "valid" : "invalid") : "-",
            colorHex: placementResult
              ? placementResult.valid
                ? sidePanel.validColorHex
                : sidePanel.invalidColorHex
              : sidePanel.mutedTextColorHex,
          },
          ...(placementResult && !placementResult.valid
            ? [{ label: "reason", value: placementResult.message ?? placementResult.failureReason ?? "-", colorHex: sidePanel.invalidColorHex }]
            : []),
          { label: "active hurdles", value: String(Object.keys(state.activeHurdleById).length) },
        ],
      },
      {
        title: "Traffic signals",
        rowList: [
          { label: "total", value: String(trafficSignalStateList.length) },
          { label: "red", value: String(trafficSignalRedCount), colorHex: trafficSignalRedCount > 0 ? sidePanel.invalidColorHex : undefined },
        ],
      },
    ];
  }

  private debugTileRowListBuild(tile: CityTile | null): DebugRow[] {
    // this lists tile type details shared by courier and hovered tile sections
    if (!tile) {
      return [{ label: "terrain", value: "out of map", colorHex: debugDisplayConfig.sidePanel.invalidColorHex }];
    }

    return [
      { label: "terrain", value: tile.terrainType },
      { label: "road class", value: tile.roadClass },
      { label: "path kind", value: tile.pathKind },
      { label: "walkable", value: tile.walkable ? "yes" : "no" },
    ];
  }

  private debugTileGet(tilePoint: CoordinateTilePoint): CityTile | null {
    // this returns null instead of throwing for points outside the map
    return this.cityMapGenerated.tileRows[tilePoint.y]?.[tilePoint.x] ?? null;
  }

  private debugSignalColorGet(stateName: string): string {
    const sidePanel = debugDisplayConfig.sidePanel;
    return stateName === TrafficSignalStateName.Red ? sidePanel.invalidColorHex : sidePanel.validColorHex;
  }

  private debugPointFormat(tilePoint: CoordinateTilePoint): string {
    return `(${tilePoint.x}, ${tilePoint.y})`;
  }

  private debugHtmlBuild(sectionList: DebugSection[]): string {
    const sidePanel = debugDisplayConfig.sidePanel;
    const titleHtml = `<div style="font-size:${sidePanel.titleFontSizePixels}px;font-weight:700;margin-bottom:${sidePanel.sectionSpacingPixels}px">Courier War debug</div>`;

    const sectionHtmlList = sectionList.map((section) => {
      const rowHtml = section.rowList
        .map(
          (row) =>
            `<div style="display:flex;justify-content:space-between;gap:12px">` +
            `<span style="color:${sidePanel.mutedTextColorHex}">${this.debugHtmlEscape(row.label)}</span>` +
            `<span style="color:${row.colorHex ?? sidePanel.textColorHex};text-align:right">${this.debugHtmlEscape(row.value)}</span>` +
            `</div>`
        )
        .join("");

      return (
        `<div style="margin-bottom:${sidePanel.sectionSpacingPixels}px;padding-top:${sidePanel.sectionSpacingPixels / 2}px;border-top:1px solid ${sidePanel.borderColorHex}">` +
        `<div style="font-weight:700;margin-bottom:4px">${this.debugHtmlEscape(section.title)}</div>${rowHtml}</div>`
      );
    });

    return titleHtml + sectionHtmlList.join("");
  }

  private debugHtmlEscape(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
}
