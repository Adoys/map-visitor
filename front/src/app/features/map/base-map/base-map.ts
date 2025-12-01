import { Component } from "@angular/core";
import { Application } from 'pixi.js';


@Component({
  selector: 'base-map',
  imports: [],
  templateUrl: './base-map.html',
  styleUrl: './base-map.scss'
})
export class BaseMapComponent {
      app = new Application();

      async initPixiApp() {
        await this.app.init({ background: '#1099bb', resizeTo: window });
        this.app.view.style.display = 'block';
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.app.canvas);
      }

      ngAfterViewInit() {
        this.initPixiApp();
      }
      

}