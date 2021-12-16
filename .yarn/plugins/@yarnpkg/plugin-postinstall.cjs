/* eslint-disable */
module.exports = {
name: "@yarnpkg/plugin-postinstall",
factory: function (require) {
var plugin;(()=>{"use strict";var e={d:(t,n)=>{for(var o in n)e.o(n,o)&&!e.o(t,o)&&Object.defineProperty(t,o,{enumerable:!0,get:n[o]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};e.r(t),e.d(t,{default:()=>c});const n=require("@yarnpkg/core"),o=require("@yarnpkg/shell"),r=require("clipanion"),l={postinstall:{description:"Postinstall hook that will always run in Yarn v2",type:n.SettingsType.STRING,default:""}};var i=function(e,t,n,o){var r,l=arguments.length,i=l<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,n):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,n,o);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(i=(l<3?r(i):l>3?r(t,n,i):r(t,n))||i);return l>3&&i&&Object.defineProperty(t,n,i),i};class a extends r.Command{async execute(){const e=(await n.Configuration.find(this.context.cwd,this.context.plugins)).get("postinstall");e&&o.execute(e)}}i([r.Command.Path("postinstall")],a.prototype,"execute",null);const c={configuration:l,commands:[a],hooks:{afterAllInstalled:e=>{const t=e.configuration.get("postinstall");t&&(console.log("Running postinstall script..."),o.execute(t))}}};plugin=t})();
return plugin;
}
};
