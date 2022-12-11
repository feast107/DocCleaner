// ==UserScript==
// @name         DocCleaner
// @namespace    Feast.Script.DocCleaner
// @version      1.0
// @description  🍊各种乱七八糟的网页的人性化调整，秦始皇看了大为称赞🍊
// @author       终宴
// @match        https://blog.csdn.net/*
// @match        https://c.pc.qq.com/*
// @match  		 https://stackoverflow.com/*
// @match  		 https://stackoverflow.org.cn/*
// @match  		 https://www.jianshu.com/*
// @match        https://www.codenong.com/*
// @match        https://wenku.baidu.com/*
// @match        https://zhuanlan.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackoverflow.com
// @require      https://cdn.staticfile.org/jquery/3.4.1/jquery.min.js
// @grant        none
// ==/UserScript==

(function () {
	'use strict';
	//全局函数
	const Global = {
		takeover: function (from, to) {
			from.parentElement?.removeChild(from);
			to.appendChild(from);
		},
		grab: function (from, to) {
			let childs = [];
			from.childNodes.forEach(x => childs.push(x));
			childs.forEach(x => {
				from.removeChild(x);
				to.appendChild(x)
			});
		},
		script: function (src, option) {
			let script = document.createElement('script');
			script.setAttribute('type', 'text/javascript');
			script.src = src;
			document.documentElement.appendChild(script);
			if (option) {
				if (option.Name && !this.Plugins[option.Name]) {
					this.Plugins[option.Name] = {};
					Startup.onPlugin((win) => {
						var plugin = this.Plugins[option.Name] = win[option.Name];
						if (option.onPlugin) {
							option.onPlugin(plugin);
						}
					});
				}
			}
		},
		css: function (src) {
			let link = document.createElement('link');
			link.setAttribute('rel', 'stylesheet');
			link.href = src;
			document.documentElement.appendChild(link);
		},
		loadVue: function (handler) {
			//https://cdn.jsdelivr.net/npm/vue@next 用以获取最新的js
			this.script("https://cdn.jsdelivr.net/npm/vue@3.2.36/dist/vue.global.min.js",
				{ Name: 'Vue', onPlugin: handler });
		},
		loadElement: function (handler) {
			//https://unpkg.com/element-plus 用以获取最新的js
			this.script("https://unpkg.com/element-plus@2.2.22/dist/index.full.min.js",
				{ Name: 'ElementPlus', onPlugin: handler });
			this.css("https://unpkg.com/element-plus/dist/index.css");
		},
		inject: function (Element) {
			let childs = [];
			document.body.childNodes.forEach(x => childs.push(x));
			childs.forEach(x => document.body.removeChild(x));
			document.body.appendChild(Element);
			childs.forEach(x => document.body.appendChild(x));
		},
		Plugins: {},
	}
	Object.freeze(Global);
	class UIElement {
		constructor(tag, id, hidden) {
			var ele = this.Container = this.Element = document.createElement(tag);
			if (id) { ele.id = id; }
			if (hidden) { ele.style.display = 'none'; }
		}
		Element = null;
		Container = null;
		show = function () { this.Element.style.display = ""; }
		hide = function () { this.Element.style.display = "none"; }
		add = function (Element) { this.Element.appendChild(Element); };
		remove = function (Element) { this.Element.removeChild(Element); };
		takeover = function (target) { Global.takeover(target, this.Container); }
		grab = function (target) { Global.grab(target, this.Container); }
	};
	//启动项 Startup.on( url, BeforeEvent(context) ，StartEvent(context,window,plugins) , context = null )
	const Startup = {
		PluginEvents: [],
		PreloadEvents: [],
		BoostConfigs: {},
		AfterloadEvents: [],
		on: function (url, before, start, context) {
			if (typeof (url) != "string") { return; }
			if (typeof (before) != "function") { before = () => { }; }
			if (typeof (start) != "function") { start = () => { }; }
			if (!context) { context = {} };
			this.BoostConfigs[url] = { Context: context, OnBefore: before, OnStart: start }
		},
		onLoad: function (loadEvent) {
			this.PreloadEvents.push(loadEvent);
		},
		onPlugin: function (loadEvent) {
			this.PluginEvents.push(loadEvent);
		},
		afterLoad: function (loadEvent) {
			this.AfterloadEvents.push(loadEvent);
		}
	}
	Object.freeze(Startup);
	//控件模板
	const Template = {
		Affix: function (id, offset, viewModel, modify) {
			let ret = new UIElement('el-affix', id).Element;
			ret.setAttribute(':offset', offset);
			let button = new UIElement('el-button').Element;
			button.type = "primary";
			button.innerText = "展开";
			button.setAttribute(':style', "{ boxShadow:'var(--el-box-shadow-dark)' }");
			button.setAttribute('v-on:click', '() => ' + viewModel + ' = true');
			button.style = 'padding:20px';
			ret.appendChild(button);
			if (modify) {
				Startup.afterLoad((win, plugs) => {
					modify(win.document.getElementById(id).childNodes[0]);
				})
			}
			return ret;
		},
		Drawer: function (id, width, direction, viewModel, openEventName) {
			let inner = new UIElement('div');
			inner.Element.id = id;
			let ret = new UIElement('el-drawer').Element;
			ret.setAttribute('size', width + 'px');
			ret.setAttribute(':with-header', false);
			ret.setAttribute('direction', direction);
			ret.setAttribute('v-model', viewModel);
			ret.setAttribute('v-on:open', '() => ' + openEventName + '()');
			ret.appendChild(inner.Element);
			return ret;
		}
	};
	const LOG = (l) => { console.log(l); };
	const href = window.location.host;

	//TODO:在此开始编写

	//CSDN
	Startup.on("blog.csdn.net",
		(context) => {
			var visual = context.Visual = new UIElement('div', 'Feast-app', true);
			Global.inject(visual.Element);
			Global.loadVue();
			Global.loadElement();
			context.setClickable();
			(function () {
				LOG("正在收起侧边栏");
				window.$(window).unbind();
				let main = document.getElementById("mainBox");
				var ASIDE = new UIElement('aside');
				var aside = main.childNodes[5];
				ASIDE.Element.setAttribute('width', aside.offsetWidth);
				ASIDE.grab(aside);//提取子项
				context.Aside = ASIDE.Element;
				main.childNodes[3].style.width = "100%";
			})();
			let affix = Template.Affix('affix', 120, 'draw', (a) => { a.style.left = '30px'; });
			let drawer = Template.Drawer("drawerContainer", context.Aside.width + 50, 'ltr', 'draw', 'onOpen');
			visual.add(affix);
			visual.add(drawer);
		},
		(context, win, plugins) => {
			var visual = context.Visual;
			const App = {
				mounted() {
					LOG("挂载");
				},
				data() {
					return {
						draw: false,
						onOpen: function () {
							Global.takeover(context.Aside, document.getElementById('drawerContainer'));
						},
					};
				},
				methods: {
				}
			};
			const app = plugins.Vue.createApp(App);
			app.use(plugins.ElementPlus);
			app.$message = plugins.ElementPlus.ElMessage;
			app.mount(visual.Element);
			visual.show();
			context.setClickable(() => { app.$message.success('复制成功'); });
			if (context.Aside) {
				app.$message.success("左边栏收起了噢");
			}
			else {
				app.$message.warning("没有找到捏");
			}
		},
		{
			setClickable: (Alert) => {
				var hs = document.getElementsByClassName('hljs-button signin');
				for (let i = 0; i < hs.length; i++) {
					hs.item(i).onclick = () => {
						window.hljs.copyCode(event);
						if (Alert) {
							Alert();
						}
					};
					hs.item(i).setAttribute('data-title', "尽情的复制吧");
				}
				document.querySelectorAll('code').forEach(x => {
					x.style.userSelect = "text";
				});
			}
		});

	//qq外链
	Startup.on("c.pc.qq.com",
		(context) => {
			var link = new URL(window.location.href).searchParams.get('pfurl');
			if (link) {
				window.location.href = link;
			}
		},
		null);

	//StackOverflow
	var StackOverFlowBefore = (context) => {
		var visual = context.Visual = new UIElement('div', 'Feast-app', true);
		Global.inject(visual.Element);
		Global.loadVue();
		Global.loadElement();
		var rightSide = document.getElementById('sidebar');
		document.getElementById('mainbar').style.width = 'calc(100% - var(--su-static24))';
		let affix = Template.Affix('right-affix', 120, 'RightDraw', (a) => { a.style.right = '100px'; });
		let drawer = Template.Drawer('rightDrawerContainer', rightSide.clientWidth + 50, 'rtl', 'RightDraw', 'onRightOpen');
		var aside = context.RightAside = new UIElement('div');
		aside.takeover(rightSide);
		visual.add(affix);
		visual.add(drawer);
	}
	var StackOverFlowStart = (context, win, plugins) => {
		var visual = context.Visual;
		const App = {
			mounted() {
				LOG("挂载");
			},
			data() {
				return {
					RightDraw: false,
					onRightOpen: function () {
						var inner = document.getElementById('rightDrawerContainer');
						var drawer = inner.parentElement;
						drawer.style.marginTop = '50px';
						drawer.style.marginBottom = '10px';
						Global.takeover(context.RightAside.Element, inner);
					},
				};
			},
			methods: {
			}
		};
		const app = plugins.Vue.createApp(App);
		app.use(plugins.ElementPlus);
		app.$message = plugins.ElementPlus.ElMessage;
		app.mount(visual.Element);
		visual.show();
	}
	Startup.on("stackoverflow.com", StackOverFlowBefore, StackOverFlowStart);
	Startup.on("stackoverflow.org.cn", StackOverFlowBefore, StackOverFlowStart);

	//简书
	Startup.on("www.jianshu.com",
		(context) => {
			Global.loadVue();
			Global.loadElement();
			let visual = context.Visual = new UIElement('div', 'Feast-app', true);
			Global.inject(visual.Element);
			let rightSide = document.querySelector('aside');
			let affix = Template.Affix('right-affix', 120, 'RightDraw', (a) => { a.style.right = '100px'; });
			let drawer = Template.Drawer('rightDrawerContainer', rightSide.clientWidth + 50, 'rtl', 'RightDraw', 'onRightOpen');
			var aside = context.RightAside = new UIElement('div');
			aside.takeover(rightSide);
			document.querySelector('[role=main]').childNodes[0].style.width = '100%'
			visual.add(affix);
			visual.add(drawer);
		},
		(context, win, plugins) => {
			var visual = context.Visual;
			const App = {
				mounted() {
					LOG("挂载");
				},
				data() {
					return {
						RightDraw: false,
						onRightOpen: function () {
							var inner = document.getElementById('rightDrawerContainer');
							Global.takeover(context.RightAside.Element, inner);
						},
					};
				},
				methods: {
				}
			};
			const app = plugins.Vue.createApp(App);
			app.use(plugins.ElementPlus);
			app.$message = plugins.ElementPlus.ElMessage;
			app.mount(visual.Element);
			visual.show();
		});

	//码农家园
	Startup.on("www.codenong.com",
		(context) => { document.getElementById('primary').style.width = '100%'; });

	//百度文库
	Startup.on("wenku.baidu.com",
		(context) => {
			var visual = context.Visual = new UIElement('div', 'Feast-app', true);
			Global.inject(visual.Element);
			Global.loadVue();
			Global.loadElement();
			var ASIDE = new UIElement('aside');
			let aside = document.getElementById('app-right');
			ASIDE.Element.style.width = aside.clientWidth;
			ASIDE.takeover(aside);
			context.Aside = ASIDE.Element;
			let main = document.getElementsByClassName('center-wrapper')[0];
			main.style.width = 'calc(100% - 280px)';
			let affix = Template.Affix('right-affix', 120, 'RightDraw', (a) => { a.style.right = '90px'; });
			let drawer = Template.Drawer("rightDrawerContainer", context.Aside.style.width + 50, 'rtl', 'RightDraw', 'onRightOpen');
			visual.add(affix);
			visual.add(drawer);
		},
		(context, win, plugins) => {
			var visual = context.Visual;
			const App = {
				mounted() {
					LOG("挂载");
				},
				data() {
					return {
						RightDraw: false,
						onRightOpen: function () {
							Global.takeover(context.Aside, document.getElementById('rightDrawerContainer'));
						},
					};
				},
				methods: {
				}
			};
			const app = plugins.Vue.createApp(App);
			app.use(plugins.ElementPlus);
			app.$message = plugins.ElementPlus.ElMessage;
			app.mount(visual.Element);
			visual.show();
			if (context.Aside) {
				app.$message.success("右侧栏收起");
			}
			else {
				app.$message.warning("没有找到捏");
			}
		});

	//知乎
	Startup.on("zhuanlan.zhihu.com",
		(context) => {
			let width = '80%';
			for (var i = 0; i < document.styleSheets.length; i++) {
				document.styleSheets[i].insertRule('.Post-SideActions { right:calc(50vw - 700px) }', 0);
				document.styleSheets[i].insertRule('.css-78p1r9 { max-width:' + width + ' }', 0);
				document.styleSheets[i].insertRule('.Post-NormalMain .Post-Header { width:' + width + ' }', 0);
				document.styleSheets[i].insertRule('.Post-NormalMain>div, .Post-NormalSub>div  { width:' + width + ' }', 0);
			}

			var interval = setInterval(() => {
				let targ = document.getElementsByClassName('Modal-wrapper')[0];
				if (!targ) return;
				clearInterval(interval);
				document.getElementsByClassName('Modal-closeButton')[0].click();
			}, 10);

			var interval2 = setInterval(() => {
				let targ = document.getElementsByClassName('css-1izy64v')[0];
				if (!targ) return;
				clearInterval(interval2);
				targ.parentElement.removeChild(targ);
			}, 10);
		});

	//在以上区域编写
	var config = Startup.BoostConfigs[href];
	window.onload = () => {
		Startup.PluginEvents.forEach(x => { x(window); });
		Startup.PreloadEvents.forEach(x => { x(window, Global.Plugins); });
		config.OnStart(config.Context, window, Global.Plugins);
		Startup.AfterloadEvents.forEach(x => { x(window, Global.Plugins); });
	}
	config.OnBefore(config.Context);
})();