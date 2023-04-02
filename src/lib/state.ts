import { atom } from "recoil";

export const selectedBuilding = atom({
  key: "selectedBuilding",
  default: null,
});

export const selectedBuildingRangeState = atom({
  key: "selectedBuildingRangeState",
  default: {
    available: null,
    active: {} as any,
  },
});
