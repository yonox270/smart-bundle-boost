import{r as n,j as t}from"./jsx-runtime-BMrMXMSG.js";import{a as x,b as y,_ as f,e as a,M as S,L as j,S as w}from"./components-B34O_SVR.js";import{u as g,a as M,O as k}from"./index-C_v_ZAYe.js";/**
 * @remix-run/react v2.17.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l="positions";function O({getKey:r,...c}){let{isSpaMode:p}=x(),o=g(),u=M();y({getKey:r,storageKey:l});let d=n.useMemo(()=>{if(!r)return null;let e=r(o,u);return e!==o.key?e:null},[]);if(p)return null;let m=((e,h)=>{if(!window.history.state||!window.history.state.key){let s=Math.random().toString(32).slice(2);window.history.replaceState({key:s},"")}try{let i=JSON.parse(sessionStorage.getItem(e)||"{}")[h||window.history.state.key];typeof i=="number"&&window.scrollTo(0,i)}catch(s){console.error(s),sessionStorage.removeItem(e)}}).toString();return n.createElement("script",f({},c,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${m})(${a(JSON.stringify(l))}, ${a(JSON.stringify(d))})`}}))}function _(){return t.jsxs("html",{lang:"en",children:[t.jsxs("head",{children:[t.jsx("meta",{charSet:"utf-8"}),t.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),t.jsx(S,{}),t.jsx(j,{}),t.jsx("script",{src:"https://cdn.shopify.com/shopifycloud/app-bridge.js"})]}),t.jsxs("body",{children:[t.jsx(k,{}),t.jsx(O,{}),t.jsx(w,{})]})]})}export{_ as default};
