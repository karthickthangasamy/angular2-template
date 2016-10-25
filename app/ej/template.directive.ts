import {Component, Directive, ElementRef, ViewContainerRef, TemplateRef, EmbeddedViewRef, Optional, Input, Host, Inject, forwardRef} from '@angular/core';
import {EJComponents} from './core';


@Directive({
    selector: '[j-template]'
})
export class JTemplateDirective{  
    static widget: any;
    private childViews : any = [];
    constructor(protected el: ElementRef, protected viewContainerRef: ViewContainerRef,
        protected templateRef: TemplateRef<any>) {           
    }

    ngOnInit(){
        console.log("jtemplate");
    }

    ngAfterViewInit(){
       this.compileTempalte();
    }

     compileTempalte() {
        let element = JTemplateDirective.widget.element;
        let childView: EmbeddedViewRef<any>;
        let templates = $(element).find('.ej-angular-template');
        let templateObject = JTemplateDirective.widget.angularTemplate;
        for (let template in templateObject) {
            let tmplElement = templates.filter('.' + templateObject[template].key);
            if (tmplElement.length) {
                for (let i = 0; i < tmplElement.length; i++) {
                    childView = this.viewContainerRef.createEmbeddedView(this.templateRef, { '$implicit': templateObject[template].itemData[i] });
                    this.childViews[i] = childView;
                    $(tmplElement[i]).append(childView.rootNodes);
                }
            } else {
                delete templateObject[template];
            }
        }
    }
}