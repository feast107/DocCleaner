# DocCleaner
运行在油猴的脚本工具，提供更简洁的文档页面

---
# [已支持的站点](SUPPORTS.md)

# 开始
## 目录
+ [启动项](#启动项)
+ [插件](#插件)
+ [样式表](#样式表)
+ [模板](#模板)

## 启动项
注册启动事件
``` js
Startup.on(url:String,//启动地址
            before:function(context){},//预加载事件
            start:function(context,window,plugins){},//启动事件
            context:Object|null//自定义上下文
            );
```
### 参数 :
1. `url` : 地址   
2. `before` : 预加载的事件  
    1. `context` : 如 `context`
3. `start` : 主事件   
    1. `context` : 如 `context`   
    2. `window` : 加载完成时的 `Window` 上下文   
    3. `plugins` : 预加载时注入的插件
4. `context` : 自定义配置的上下文，若置空则提供一个空的对象

### **须知**
+ *如果不依赖某些插件，预加载的事件可以当主事件编写，他们会获得更好的性能*

+ **配置的地址也需要在开头的 `@match` 字段中添加以告知油猴加载本插件**
+ 通常情况下， `Global` 等字段不可修改的，允许在编写时对他们进行增改，但是运行时他们是 **只读** 的
---


## 插件
加载插件
``` js
Global.script(url:String,//插件地址
                option:{
                    Name:String,//插件名称
                    onPlugin:function(plugin){}//插件回调函数
                });
```
### 参数 :
1. `url` : 地址, 他们来自于 `window.location.host`   
2. `option` : 加载的选项，置空将由调用者自行处理   
    + `Name` : 名称 **十分**~~乃至九分~~**的重要** ，他将决定如何在 `plugin` 中布局
    + `onPlugin` : 插件加载的回调，如果你想单独接收来自该插件的响应

目前已经预置了一些加载项如
``` js
Global.loadVue(handler:function(plugin){});//加载Vue
Global.loadElement(handler:function(plugin){});//加载ElementPlus
```

---

## 样式表
加载样式表
``` js
Global.css(url:String)//样式表地址
```
---

## 模板
``` js
const Template = { ... }
```
模板中封装了一些立即可用的 `dom` 控件，可以自定义添加，但是请保证**他们能够尽可能的配置**

---



# 更好的[想法](#更好的想法)
你说得对，但是如果你有更好的[想法](#更好的想法)，那么你说得对