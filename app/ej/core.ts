import {
    Provider, forwardRef, ComponentFactory, ViewContainerRef, ContentChildren,
    ViewEncapsulation, EventEmitter, QueryList, Type, ContentChild,
    Component, enableProdMode, Directive, ElementRef, Input, OnInit, SimpleChange, DoCheck,
    ChangeDetectionStrategy, ChangeDetectorRef, TemplateRef, ViewChild, EmbeddedViewRef, ComponentFactoryResolver
} from '@angular/core';
import {DomSanitizer} from "@angular/platform-browser";


import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export { ContentChild, Type, forwardRef } from '@angular/core';

export interface IParentTag {
    tags: Array<any>;
}

export interface IChildChange {
    index: number;
    change: any;
}

export interface IChangeSet {
    [key: string]: Array<IChildChange>
}

var firstVal = {};

/** Internal Helpers */
export class Utils {
    static IterateAndGetChanges(obj: IParentTag): IChangeSet {
        if (ej.isNullOrUndefined(obj.tags) || obj.tags.length === 0)
            return null;
        var changes: Array<IChildChange>, res: IChangeSet = {};
        for (var i = 0, tags = obj.tags; i < tags.length; i++) {
            var tag = tags[i], tagElement = obj["_" + tag.replace(/\./g, '_')];
            if (!ej.isNullOrUndefined(tagElement) && tagElement.hasChanges) {
                res[tag] = tagElement.getChangesAndReset();
            }
        }
        return res;
    }

    static AngularizeInputs(inputs: Array<string>, twoways: Array<string>): Array<string> {
        for (var i = 0, len = inputs.length; i < len; i++) {
            var element = inputs[i];
            inputs[i] = "model." + element + ": " + element;
        }
        for (var i = 0; i < twoways.length; i++) {
            var element = twoways[i];
            element = "model." + element + "_two:" + element;
            inputs.push(element);
        }
        return inputs;
    }

    static AngularizeOutputs(outputs: Array<string>): Array<string> {
        for (var i = 0, len = outputs.length; i < len; i++) {
            var element = outputs[i];
            if (element.startsWith("model."))
                continue;
            outputs[i] = "e" + element.substring(0, 1).toUpperCase() + element.substring(1);
        }
        return outputs;
    }
}

export class EJComponents<W, T> implements IParentTag {
    public tags: Array<any>;
    public model: T = <T>{};
    public widget: W;
    protected outputs: Array<string>;
    protected twoways: Array<string>;
    protected __shadow: DocumentFragment;
    protected complexProperties: Array<string>;
    public static widgetInstance : any;
    private _firstCheck: boolean = true;

    constructor(protected name: string, protected el: ElementRef, protected cdRef: ChangeDetectorRef) {
        //        this.__shadow = this.dom.getShadowRoot(this.el.nativeElement);
        this.createEvents(this.outputs);
        this.createTwoways(this.twoways);
    }

    protected createEvents(events: Array<string>) {
        var model = this.model, self = this;
        if (events && events.length) {
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                if (event.startsWith("model."))
                    continue;
                self[event] = new EventEmitter(false);
            }
        }

        var complex = this.complexProperties;
        if (complex && complex.length) {
            for (var i = 0; i < complex.length; i++) {
                var element = complex[i];
                ej.createObject(element, {}, model);
            }
        }
    }

    protected createTwoways(twoways: Array<string>) {
        if (!twoways) return;
        var model = this.model;
        for (var i = 0; i < twoways.length; i++) {
            var element = twoways[i];
            if (element.indexOf(":") !== -1) {
                element = element.replace(/:.+/g, "");
            }
            ej.createObject(element + "Change", new EventEmitter(), model);
            ej.createObject(element, this.addTwoways(element), model);
        }
    }

    protected addTwoways(prop): Function {
        var self = this, model = this.model, value = firstVal;//, originalProp = prop.replace(/-/g, ".");
        return function (newVal, isApp: boolean) {
            if (value === firstVal) {
                value = ej.getObject(prop + "_two", model);
                if (value === undefined)
                    value = ej.getObject(prop, this === undefined || this.defaults === undefined ? {} : this.defaults);
            }
            if (newVal === undefined) {
                return value;
            }
            if (value === newVal) return;
            value = newVal;
            if (!isApp) {
                ej.createObject(prop + "_two", newVal, model);
                ej.getObject<EventEmitter<any>>(prop + "Change", model).emit(newVal);
            }
        }
    }
    ngAfterContentInit() {
        this._firstCheck = false;

        for (var i = 0; i < this.tags.length; i++) {
            var element = this.tags[i], item = this["_" + element.replace(/\./g, '_')];
            if (!ej.isNullOrUndefined(item))
                ej.createObject(element, item.getList(), this.model);
        }

        var model = this.model, self = this, events = this.outputs;
        if (events) {
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                EJComponents.bindAndRaiseEvent(this, model, event);
            }
        }
        this.widget = $(this.el.nativeElement)["ej" + this.name](this.model)["ej" + this.name]("instance");
        this.widgetInstance(this.widget);
    }
    
    widgetInstance(widget){
        this.widgetInstance = widget;
    }
    public static getWidgetInstance(){
        return this.widgetInstance;
    }
    private static bindAndRaiseEvent(instance, model, event) {
        if (!event.startsWith("model.")) {
            model[event] = function (params) {
                instance[event]["emit"](params);
            }
        }
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        if (this._firstCheck)
            return;
        var ngChanges = {};
        for (let key in changes) {
            let element = changes[key];
            if (element.previousValue === element.currentValue)
                break;
            key = key.replace("model.", "");
            if (key.endsWith("_two")) {
                let oKey = key.replace("_two", ""), valFn = ej.getObject<Function>(oKey, this.widget["model"]);
                valFn(element.currentValue, true);
                ej.createObject(oKey, valFn, ngChanges);
            }
            ej.createObject(key, element.currentValue, ngChanges);
        }

        this.widget["setModel"](ngChanges, $.isPlainObject(ngChanges));
    }

    ngAfterContentChecked() {
        /// TODO: ChangeDetection Third/Multi level
        var changes: IChangeSet = Utils.IterateAndGetChanges(this);
        for (var key in changes) {
            if (changes.hasOwnProperty(key)) {
                var element = changes[key];
                this.widget["_" + key](element);
            }
        }
    }

    ngOnDestroy() {
        this.widget['destroy']();
    }
}

export class ComplexTagElement {
    recentChanges: any;
    hasChanges: boolean = false;
    __firstChange: boolean = true;
    __index: number;
    __valueChange: EventEmitter<any> = new EventEmitter();
    protected complexProperties: Array<string>;
    property: string;
    __parent: EJComponents<any, any>

    tags: Array<string>;

    constructor() {
        var complexes = this.complexProperties;
        for (var i = 0; complexes !== undefined && i < complexes.length; i++) {
            var element = complexes[i];
            ej.createObject(element, {}, this);
        }
    }

    ngOnInit() {
        this.__firstChange = false;
    }

    ensureCleanObject() {
        var tags = this.tags;
        for (var i = 0; i < tags.length; i++) {
            var element = tags[i], tagElement = this["_" + element.replace(/\./g, '_')];

            if (i === 0 && this[element]) return;
            if (ej.isNullOrUndefined(tagElement)) continue;

            ej.createObject(element, tagElement.getList(), this);
        }
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        if (this.__firstChange)
            return;
        this.recentChanges = changes;
        this.hasChanges = true;
    }

    getChangesAndReset() {
        if (this.hasChanges === false)
            return;

        var changes = this.recentChanges || {};

        for (let key in changes) {
            if (changes.hasOwnProperty(key)) {
                changes[key] = changes[key].currentValue;
            }
        }

        var contentChanges = Utils.IterateAndGetChanges(this)
        if (!$.isEmptyObject(contentChanges)) {
            for (let key in contentChanges) {
                if (contentChanges.hasOwnProperty(key)) {
                    var element = contentChanges[key];
                    //this.el.nativeElement.
                    this.__parent.widget["_" + this.property.replace(/\./g, '_') + "_" + key](element);
                }
            }
        }

        this.hasChanges = false;

        return changes;
    }

    ngAfterContentChecked() {
        var tags = this.tags;
        for (var i = 0, len = tags.length; i < len; i++) {
            var element = tags[i], tagElement = this["_" + element.replace(/\./g, '_')];
            if (tagElement && tagElement.hasChanges)
                this.hasChanges = true;
        }
    }
}

export class ArrayTagElement<T extends ComplexTagElement> {
    list: Array<T>;
    children: QueryList<T>;
    recentChanges: Array<IChildChange>;
    hasChanges: boolean = false;

    constructor(public propertyName: string) {
    }

    // TODO: Need to consider dynamic child change
    ngAfterContentInit() {
        var index = 0;
        this.list = this.children.map((child) => {
            child.__index = index++;
            child.property = this.propertyName;
            return child;
        });
    }

    ngOnChanges(changes) {
    }

    getList() {
        var list = this.list;
        for (var i = 0; i < list.length; i++) {
            list[i].ensureCleanObject();
        }
        return list;
    }

    getChangesAndReset(): Array<IChildChange> {
        this.hasChanges = false;
        return this.recentChanges;
    }

    ngAfterContentChecked(): void {
        var changes = {}, res: Array<IChildChange> = changes[this.propertyName] = [], childChange;

        for (var i = 0, list = this.list; i < list.length; i++) {
            var child = list[i];
            if (child.hasChanges) {
                childChange = child.getChangesAndReset();
                if (!ej.isNullOrUndefined(childChange)) {
                    res.push(<IChildChange>{
                        index: child.__index,
                        change: childChange
                    });
                }
            }
        }

        if (res.length > 0) {
            this.recentChanges = res;
            this.hasChanges = true;
        }
    }
}

export function CreateComplexDirective(args: {
    selector: string,
    inputs: Array<string>,
    outputs?: Array<string>,
    queries?: { [key: string]: any }
}, ejArgs): Type<any> {
    return Directive(args).Class({
        extends: ComplexTagElement,
        constructor: [ejArgs.type, function (widget: EJComponents<any, any>) {
            this.tags = ejArgs.tags;
            this.complexProperties = ejArgs.complexes;
            this.__parent = widget;
            ComplexTagElement.call(this);
        }]
    })
}

export class TemplateElement {
    private context: any;
    __parent: any;
    private childViews: any = [];
     @ViewChild('e-template', {read: ViewContainerRef}) contentTarget;
    constructor(protected el: ElementRef, protected viewContainerRef: ViewContainerRef,
        protected templateRef: TemplateRef<any>,  protected componentResolver: ComponentFactoryResolver, protected sanitizer: DomSanitizer) {

    }

    // constructor(protected el: ElementRef) {
        
    // }

    ngOnInit() {
        var template = this.viewContainerRef.createEmbeddedView(this.templateRef);
        let templID = ej.getGuid('angulartmplstr')
        var tempEle = ej.buildTag("div#" + templID);
        $(tempEle).append(template.rootNodes);
        this.__parent.template = $($(tempEle).append(template.rootNodes)).html();
        this.__parent.templateRef = this.templateRef;
        this.__parent.viewRef = this.viewContainerRef;
        $(tempEle).remove();        
    }
    ngAfterViewInit() {
        window.setTimeout(() => {
            this.compileTempalte();
        }, 0);
        let element = this.__parent.__parent.widget.element;
        element.on(this.__parent.__parent.widget.pluginName + 'refresh', () => {
            if (this.__parent.__parent.widget.angularTemplate) {
                this.compileTempalte();
            }
        });
    }

    compileTempalte() {
        let widget = this.__parent.__parent.widget;
        let element = widget.element;
        let childView: EmbeddedViewRef<any>;
        let templates = $(element).find('.ej-angular-template');
        let templateObject = widget.angularTemplate;
        for (let template in templateObject) {
            let tmplElement = templates.filter('.' + templateObject[template].key);
            if (tmplElement.length) {
                for (let i = 0; i < tmplElement.length; i++) {

                    // this.sanitizer.bypassSecurityTrustHtml($(tmplElement[i]).outerHTML());
                    // childView = this.__parent.viewRef.createEmbeddedView(this.__parent.templateRef, { '$implicit': templateObject[template].itemData[i] });
                    // this.childViews[i] = childView;
                    // $(tmplElement[i]).empty().append(childView.rootNodes);
                    // var j = this.createContentComponent(templateObject[template].dynamicID + i, $(tmplElement[i]).outerHTML(), templateObject[template].itemData[i]);

                    // var dynamicComponent = this.createContentComponent(templateObject[template].dynamicID + i, $(tmplElement[i]).outerHTML(), templateObject[template].itemData[i]);
                    // this.componentResolver.resolveComponent(dynamicComponent)
                    //     .then((factory: any) => this.contentTarget.createComponent(factory));

                    // let factory = this.componentResolver.resolveComponentFactory(dynamicComponent);
                    // let componentRef = this.contentTarget.createComponent(factory);
                    // componentRef.instance.data = templateObject[template].itemData[i];
                    // debugger
                }
            } else {
                delete templateObject[template];
            }
        }
    }

     
   createContentComponent(selector, template, dataVal) {
        let data = dataVal;
        @Component({
            selector: selector,
            templateUrl: template,
            providers: []
        })
        class MyNgIncludeContent {
          private data: any;
          constructor() {
            this.data = data;
          }
        }
        return MyNgIncludeContent ;
    }


    clearTempalte() {
        let templateObject = this.__parent.widget.angularTemplate;
        if (templateObject && Object.keys(templateObject).length) {
            for (let tmpl in templateObject) {
                delete templateObject[tmpl];
            }
        }
        for (let childView in this.childViews)
            delete this.childViews[childView];
        // this.viewContainerRef.remove();
    }
    ngOnDestroy() {
        this.clearTempalte();
    }
}


export function CreateTemplateDirective(args: {
    selector: string,
    inputs?: Array<string>,
    outputs?: Array<string>,
    queries?: { [key: string]: any }
}, ejArgs): Type<any> {
    return Directive(args).Class({
        extends: TemplateElement,
     constructor: [ElementRef, ViewContainerRef, TemplateRef, ComponentFactoryResolver, DomSanitizer, ejArgs.type, function (el: ElementRef, viewContainerRef: ViewContainerRef, templateRef: TemplateRef<any>, res: ComponentFactoryResolver, d:DomSanitizer, widget: EJComponents<any, any>) {
   //          constructor: [ElementRef, ejArgs.type, function (el: ElementRef, widget: EJComponents<any, any>) {
            this.tags = ejArgs.tags;
            this.complexProperties = ejArgs.complexes;
            this.__parent = widget;
            this.context = {};
            TemplateElement.call(this, el, viewContainerRef, templateRef, res,d);
            //TemplateElement.call(this, el);
        }]
    })
}

export function CreateArrayTagDirective(property: string, selector: string, type): Type<any> {
    return Directive({
        selector: selector,
        queries: {
            children: new ContentChildren(type)
        }
    }).Class({
        extends: ArrayTagElement,
        constructor: function () {
            ArrayTagElement.call(this, property);
        }
    })
}

export function CreateComponent(name: string, componentArgs: {
    selector: string,
    inputs: Array<string>,
    outputs: Array<string>,
    directives?: any, 
    template: string,
    changeDetection?: any,
    queries: {
        [key: string]: any
    }
}, ejArgs): Type<any> {
    componentArgs.changeDetection = ChangeDetectionStrategy.OnPush;  
     
    var comp = Component(componentArgs);
    return comp.Class({
        extends: EJComponents,
        constructor: [ElementRef, ChangeDetectorRef, function (el: ElementRef, cdRef: ChangeDetectorRef) {
            this.tags = ejArgs.tags;
            this.outputs = componentArgs.outputs;
            this.twoways = ejArgs.twoways;
            this.complexProperties = ejArgs.complexes;
            EJComponents.call(this, name, el, cdRef);
        }]
    })
}

export function CreateControlValueAccessor(selector: string, component: Type<any>): Type<any> {
    var EJDefaultValueAccessor;
    var constAccessor = {
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => EJDefaultValueAccessor), multi: true
    };

    var valDirective = Directive({
        selector: selector,
        host: { '(change)': 'onChange($event.value)', '(focusOut)': 'onTouched()' },
        providers: [constAccessor]
    })

    EJDefaultValueAccessor = valDirective.Class({
        constructor: [component, function (host) {
            this.host = host;
        }],
        onChange: (_) => { },
        onTouched: () => { },

        writeValue(value: any): void {
            if (this.host.widget)
                this.host.widget.option("model.value", value);
            else
                this.host.model.value = value;
        },

        registerOnChange(fn: (_: any) => void): void {
            this.onChange = fn;
        },

        registerOnTouched(fn: () => void): void {
            this.onTouched = fn;
        }
    })

    return EJDefaultValueAccessor;
}


ej.template['text/x-template'] = (self, selector, data, index, prop) => {
    let templateObject = self.angularTemplate;
    if (!templateObject || !templateObject[selector]) {
        templateObject = templateObject || {};
        templateObject[selector] = { dynamicID: ej.getGuid('ng2dynamicid'), key: ej.getGuid('angulartmpl'), itemData: [], views: [] };
        self.angularTemplate = templateObject;
    }
    let scope = templateObject[selector];
    if (!ej.isNullOrUndefined(index)) {
        if (!scope.itemData)
            scope.itemData = [];
        scope.itemData[index] = data;
    } else {
        scope.itemData = [data];
    }
    let actElement = $(selector).html() || '';
    let tempElement = "<div ej-prop='" + index + "' #" + templateObject[selector].dynamicID + index + " class='" + templateObject[selector].key + " ej-angular-template'>" + actElement + '</div>';
    return tempElement;
}

ej.template.render = ej.template['text/x-template'];

(function($) {
  $.fn.outerHTML = function() {
    return $(this).clone().wrap('<div></div>').parent().html();
  };
})(jQuery);