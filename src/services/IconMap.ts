import { iconList } from "@app/Data/iconForSelectIconPicker";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export const IconMap: Record<string, IconDefinition> = iconList.reduce((map, item) => {
  map[item.key] = item.icon;
  return map;
}, {} as Record<string, IconDefinition>);
