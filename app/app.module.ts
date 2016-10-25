import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent }  from './app.component';
import {NorthwindService} from './services/northwind.service';


/** Syncfusion Angular 2 component **/
import {EJ_GRID_COMPONENTS } from './ej/grid.component';
import {EJ_BUTTON_COMPONENTS} from './ej/button.component';
import {JTemplateDirective} from './ej/template.directive';

@NgModule({
  imports: [BrowserModule],
  declarations: [AppComponent, EJ_GRID_COMPONENTS, EJ_BUTTON_COMPONENTS, JTemplateDirective],
  providers: [NorthwindService],
  bootstrap: [AppComponent]
})
export class AppModule { }