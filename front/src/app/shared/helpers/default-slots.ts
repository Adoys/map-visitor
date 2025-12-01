import { ETypeSlot } from '../interfaces/ETypeSlot';
import { InternalSlotData } from '../interfaces/IDataSlot';
import { SlotData } from '../interfaces/IMapData';
import { IMapDataType } from '../interfaces/IMapDataType';
import { ContainerDescriptor, ContainerDescriptorData } from '../interfaces/map';
import { Coordinates, ObjectWithDimensions } from '../interfaces/pixi';
import { getContainerCenter, getTextureFromAsset } from './pixi-utils';

const defaultTableSlots: InternalSlotData[] = [
  {
    repeat: 1,
    type: ETypeSlot.TABLE,
    label: 'table-big',
    id: 'table-big',
    assetId: 'table-big',
    scale: 2.8,
  },
  {
    repeat: 1,
    type: ETypeSlot.TABLE,
    label: 'table',
    id: 'table',
    assetId: 'table',
    scale: 2.5,
  },
  {
    repeat: 1,
    type: ETypeSlot.TABLE,
    label: 'table1',
    id: 'table1',
    assetId: 'table1',
    scale: 2.5,
  },
  {
    repeat: 1,
    type: ETypeSlot.TABLE,
    label: 'table2',
    id: 'table2',
    assetId: 'table2',
    scale: 2.3,
  },
  {
    repeat: 1,
    type: ETypeSlot.TABLE,
    label: 'table3',
    id: 'table3',
    assetId: 'table3',
    scale: 3.5,
  },
  {
    repeat: 1,
    type: ETypeSlot.TABLE,
    label: 'table4',
    id: 'table4',
    assetId: 'table4',
    scale: 4.6,
  },
];

const slotFactory = (nums: number[], prefix: string, type: ETypeSlot, scale: number): InternalSlotData[] => {
  return nums.map((num) => ({
    repeat: num,
    type,
    label: `${prefix}-${num}`,
    id: `${prefix}-${num}`,
    assetId: 'slot',
    scale: scale,
  }));
};

const availableSlots: InternalSlotData[] = [
  ...slotFactory([1, 2, 3, 4, 5, 6, 7, 8], 'slot', ETypeSlot.LINE, 1),
  ...slotFactory([4, 6, 8], 'slot-circle', ETypeSlot.CIRCLE, 1),
  ...slotFactory([6, 8, 12], 'slot-oval', ETypeSlot.OVAL, 1),
  ...defaultTableSlots,
];

const offsets = {
  oval: { x: 200, y: 300 },
};

const customOvalSlots: Record<string, ContainerDescriptorData[]> = {
  [IMapDataType.INFO_POINT]: [
    {
      assetId: 'slot',
      label: 'slot-oval-6-slot-0',
      anchor: { x: 0.5, y: 0.5 },
      x: 1000 + offsets['oval'].x,
      y: 775 + offsets['oval'].y,
      angle: 150,
    },
    {
      assetId: 'slot',
      label: 'slot-oval-6-slot-1',
      anchor: { x: 0.5, y: 0.5 },
      x: 500 + offsets['oval'].x,
      y: 900 + offsets['oval'].y,
      angle: 180,
    },
    {
      assetId: 'slot',
      label: 'slot-oval-6-slot-2',
      anchor: { x: 0.5, y: 0.5 },
      x: 0 + offsets['oval'].x,
      y: 775 + offsets['oval'].y,
      angle: -150,
    },
    {
      assetId: 'slot',
      label: 'slot-oval-6-slot-3',
      anchor: { x: 0.5, y: 0.5 },
      x: 0 + offsets['oval'].x,
      y: 120 + offsets['oval'].y,
      angle: -30,
    },
    {
      assetId: 'slot',
      label: 'slot-oval-6-slot-4',
      anchor: { x: 0.5, y: 0.5 },
      x: 500 + offsets['oval'].x,
      y: 0 + offsets['oval'].y,
      angle: 0,
    },
    {
      assetId: 'slot',
      label: 'slot-oval-6-slot-5',
      anchor: { x: 0.5, y: 0.5 },
      x: 1000 + offsets['oval'].x,
      y: 120 + offsets['oval'].y,
      angle: 30,
    },
  ],
};

const calculateRadius = (elementSize: ObjectWithDimensions, numberOfElements: number): number => {
  const angle = (2 * Math.PI) / numberOfElements;
  const radius = elementSize.width / (2 * Math.sin(angle / 2));
  return radius + elementSize.height / 2;
};

const getSpritePositionAndAngle =
  (type: ETypeSlot, objectSize: ObjectWithDimensions, totalSteps: number) => (i: number) => {
    let x, y, angle;

    const { x: centerX, y: centerY } = getContainerCenter(objectSize);

    if (type === ETypeSlot.CIRCLE) {
      const radius = calculateRadius(objectSize, totalSteps);
      const factor = totalSteps === 6 ? 0 : 0.5;
      const radianAngle = ((i + factor) * 2 * Math.PI) / totalSteps;
      x = centerX + radius * Math.cos(radianAngle);
      y = centerY + radius * Math.sin(radianAngle);
      angle = ((i + factor) * 360) / totalSteps + 90;
    } else {
      const offset = objectSize.width * 1.1;
      x = centerX + offset * i;
      y = centerY;
      angle = 0;
    }

    return { x: Math.round(x), y: Math.round(y), angle: Math.round(angle) };
  };

const translateCoordinates = (
  data: ContainerDescriptorData[],
  customOffset: Coordinates,
): ContainerDescriptorData[] => {
  const minX = Math.min(...data.map((item) => item.x));
  const minY = Math.min(...data.map((item) => item.y));

  const internalOffset = {
    x: minX < 0 ? Math.abs(minX) : 0,
    y: minY < 0 ? Math.abs(minY) : 0,
  };

  return data.map((item) => ({
    ...item,
    x: item.x + internalOffset.x + customOffset.x,
    y: item.y + internalOffset.y + customOffset.y,
  }));
};

const slotDescriptorFactory = (opt: {
  assetId: string;
  label: string;
  type: ETypeSlot;
  repeat: number;
  scale: number;
}): ContainerDescriptor => {
  const texture = getTextureFromAsset(opt.assetId);

  if (opt.type === ETypeSlot.OVAL) {
    const descriptor = customOvalSlots[`slot-oval-${opt.repeat}`];
    return {
      label: opt.label,
      data: descriptor,
      scale: opt.scale,
    };
  }

  let descriptor = Array.from({ length: opt.repeat }).map(
    (_, i): ContainerDescriptorData => ({
      assetId: opt.assetId,
      label: (i + 1 + '').padStart(2, '0'),
      anchor: { x: 0.5, y: 0.5 },
      ...getSpritePositionAndAngle(opt.type, texture, opt.repeat)(i),
    }),
  );

  if (opt.type === ETypeSlot.CIRCLE) {
    descriptor = translateCoordinates(descriptor, { x: 300, y: 300 });
  }

  return {
    label: opt.label,
    data: descriptor,
    scale: opt.scale,
  };
};

const defaultSlotMetaData = (size: number) =>
  Array.from({ length: size }).map(
    (_, index): SlotData => ({
      id: (index + 1).toString().padStart(2, '0'),
      index,
    }),
  );

export { availableSlots, defaultSlotMetaData, slotDescriptorFactory };
