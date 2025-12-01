import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Application, Container, Renderer } from 'pixi.js';

import { SlotsSelectorComponent } from './slots-selector.component';
import { defaultSlotMetaData } from '../../helpers';
import { MapIndoorService } from '../../map-indoor.service';
import { IMapData, IMapDataType } from '../../models';
import { InternalSlot } from '../../models/internal-slot';
import { PickProps } from '../../shared/models';

describe('SlotsSelectorComponent', () => {
  let component: SlotsSelectorComponent;
  let fixture: ComponentFixture<SlotsSelectorComponent>;
  let spy: jasmine.SpyObj<MapIndoorService>;
  let mockApp: Application;
  let mockContainer: Container;
  let mockRenderer: Renderer;
  let mockBase64: string;

  beforeEach(async () => {
    mockBase64 = 'data:image/png;base64,FAKE_BASE64';
    mockRenderer = {
      width: 800,
      height: 600,
      extract: {
        base64: jasmine.createSpy('base64').and.returnValue(Promise.resolve(mockBase64)),
      },
      render: jasmine.createSpy('render'),
    } as unknown as Renderer;

    mockApp = {
      renderer: mockRenderer,
    } as Application;

    mockContainer = new Container();
    mockContainer.label = 'Slot1';

    spy = jasmine.createSpyObj('MapIndoorService', ['getSlotContainer'], {
      containerDescriptors: [{ label: 'Slot1', height: 100, width: 200 }],
    });

    spy.getSlotContainer.and.callFake(() => {
      return {
        container: mockContainer,
        data: {
          bank: 'bank',
          section: '',
          type: IMapDataType.SLOT_1,
          slots: defaultSlotMetaData(2),
        } as PickProps<IMapData, 'bank' | 'section' | 'slots' | 'type'>,
      };
    });

    await TestBed.configureTestingModule({
      imports: [SlotsSelectorComponent],
      providers: [{ provide: MapIndoorService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SlotsSelectorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.ngAfterViewInit();
    expect(component).toBeTruthy();
  });

  it('should set dataTransfer on drag start', () => {
    const mockEvent = { dataTransfer: { setData: jasmine.createSpy() } } as unknown as DragEvent;
    const mockItem = { id: 'Slot1' } as unknown as InternalSlot;

    component.onDragStart(mockEvent, mockItem);

    expect(mockEvent.dataTransfer?.setData).toHaveBeenCalledWith('slotId', 'Slot1');
  });

  it('should convert container to base64 and return expected object', async () => {
    mockContainer.position.set(100, 200);
    mockContainer = {
      label: 'Slot1',
      width: 100,
      height: 200,
    } as Container;

    const result = await component.convertContainer(mockContainer, mockApp);
    expect(result).toEqual({
      data: mockBase64,
      label: 'Slot1',
      height: 200,
      id: 'Slot1',
      width: 100,
    });
  });

  it('should update slotsMenu when promise resolves', async () => {
    spyOn(component, 'convertContainer').and.callFake((container: Container) =>
      Promise.resolve({
        data: mockBase64,
        label: container.label,
        height: container.height,
        id: container.label,
        width: container.width,
      }),
    );

    spyOn(Application.prototype, 'init').and.callFake(function (this: Application) {
      this.renderer = mockRenderer;
      return Promise.resolve();
    });

    await component.fakeAppInit();

    expect(component.convertContainer).toHaveBeenCalled();
    expect(component.slotsMenu[0]).toEqual(jasmine.objectContaining({ label: 'Slot1', data: mockBase64 }));
  });
});
