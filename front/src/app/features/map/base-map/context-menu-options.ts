import { IMenu } from "./interfaces";

export const contextMenuOptions: IMenu = {
  slots: [
    {
      id: 'copy',
      icon: 'copy',
      option: 'Copy',
    },
    {
      id: 'cut',
      icon: 'cut',
      option: 'Cut',
    },
    {
      id: 'remove',
      icon: 'trash',
      option: 'Remove',
    },
  ],
  back: [
    {
      id: 'edit-map',
      icon: 'edit',
      option: 'Change Map',
    },
    {
      id: 'edit-layout',
      icon: 'edit',
      option: 'Change Layout',
    },
    {
      id: 'paste',
      icon: 'paste',
      option: 'Paste',
    },
  ],
};
