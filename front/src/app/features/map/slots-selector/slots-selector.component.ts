import { AfterViewInit, Component, inject } from '@angular/core';
import { Application, Container } from 'pixi.js';
import { InternalSlot } from '../../../shared/interfaces/internal-slot';
import { MapService } from '../service/map.service';
import { containerToBase64 } from '../../../shared/helpers/pixi-utils';


@Component({
  selector: 'slots-selector',
  standalone: true,
  templateUrl: './slots-selector.component.html',
  styleUrl: './slots-selector.component.scss',
})
export class SlotsSelectorComponent implements AfterViewInit {
  slotsMenu: InternalSlot[] = [];
  private readonly mapService = inject(MapService);

  ngAfterViewInit(): void {
    this.fakeAppInit().catch(console.error);
  }

  fakeAppInit() {
    const fakeApp = new Application();

    return fakeApp
      .init()
      .then(() => {
        const slotContainerBase64Promises = this.mapService.containerDescriptors
          .map(({ label }) => this.mapService.getSlotContainer(label, 0.2))
          .filter((container) => !!container)
          .map(({ container }) => this.convertContainer(container, fakeApp));

        return Promise.all(slotContainerBase64Promises);
      })
      .then((results) => {
        this.slotsMenu = results;
        return this.slotsMenu;
      })
      .catch((err) => console.error(err));
  }

  convertContainer(container: Container, app: Application) {
    return containerToBase64({
      container,
      renderer: app.renderer,
    }).then((slotAsBase64) => ({
      data: slotAsBase64,
      label: container.label,
      height: container.height,
      id: container.label,
      width: container.width,
    }));
  }

  onDragStart(ev: DragEvent, item: InternalSlot) {
    ev.dataTransfer?.setData('slotId', item.id);
  }
}
