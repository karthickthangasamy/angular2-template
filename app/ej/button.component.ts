import {CreateArrayTagDirective, CreateControlValueAccessor, CreateComplexDirective, CreateComponent, Utils, ContentChild, Type, forwardRef } from './core';

var Outputs = [ "click", "create", "destroy" ];
var ComplexProperties = [   ];
var Inputs = Utils.AngularizeInputs( [ "contentType", "cssClass", "enabled", "enableRTL", "height", "htmlAttributes", "imagePosition", "prefixIcon", "repeatButton", "showRoundedCorner", "size", "suffixIcon", "text", "timeInterval", "type", "width"  ],[  ]);
export var ButtonComponent = CreateComponent("Button", {
    selector: '[ej-button]',
    inputs : Inputs,
    outputs : Outputs,
    template:"",
    queries: {
    }
},{
   tags : [], 
   twoways : [  ],  
   complexes : ComplexProperties,
});

export var ButtonValueAccessor = CreateControlValueAccessor("[ej-button]", ButtonComponent);
export const EJ_BUTTON_COMPONENTS: Type<any>[] = [ButtonComponent , ButtonValueAccessor ]

 
