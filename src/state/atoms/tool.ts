import { atom } from "recoil";
import { Tool } from "@/types/types";

export const toolState = atom<Tool>({
  key: "toolState",
  default: "freedraw",
});

export const strokeStyleState = atom({
  key: "strokeStyleState",
  default: {
    color: "#000000",
    width: 2,
    opacity: 1,
  },
});
