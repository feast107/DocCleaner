	// ==UserScript==
	// @name         DocCleaner
	// @namespace    Feast.Script.DocCleaner
	// @version      1.0
	// @description  🍊各种乱七八糟的网页的人性化调整，秦始皇看了大为称赞🍊
	// @author       终宴
	// @match        https://blog.csdn.net/*
	// @match        https://c.pc.qq.com/*
	// @match        https://cloud.tencent.com/*
	// @match        https://stackoverflow.com/*
	// @match        https://stackoverflow.org.cn/*
	// @match        https://www.jianshu.com/*
	// @match        https://www.codenong.com/*
	// @match        https://wenku.baidu.com/*
	// @match        https://zhuanlan.zhihu.com/*
	// @match        https://www.zhihu.com/*
	// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackoverflow.com
	// @require      https://cdn.staticfile.org/jquery/3.4.1/jquery.min.js
	// @grant        none
	// ==/UserScript==

	(function () {
		'use strict';
		//全局函数
		const Global = {
			/**
			 * 由to接管from自身
			 * @param {Object} from 被接管的元素
			 * @param {Object} to 接管的元素
			 */
			takeover: function (from, to) {
				from.parentElement?.removeChild(from);
				to.appendChild(from);
			},
			/**
			 * 由to接管from的子元素
			 * @param {Object} from 被接管的容器
			 * @param {Object} to 接管的元素
			 */
			grab: function (from, to) {
				let childs = [];
				from.childNodes.forEach(x => childs.push(x));
				childs.forEach(x => {
					from.removeChild(x);
					to.appendChild(x)
				});
			},
			/**
			 * 加载插件
			 * @param {String} src 插件url
			 * @param {{Name:String,onPlugin:Function}} option 插件选项
			 */
			script: function (src, option) {
				let script = document.createElement('script');
				script.setAttribute('type', 'text/javascript');
				script.src = src;
				document.head.appendChild(script);
				if (option) {
					if (option.Name && !this.Plugins[option.Name]) {
						this.Plugins[option.Name] = {};
						Startup.onPlugin((win) => {
							let plugin = this.Plugins[option.Name] = win[option.Name];
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
				document.head.appendChild(link);
			},
			addCSP:function(){
				let meta = document.createElement('meta');
				meta.setAttribute('content',"script-src  cdn.jsdelivr.net; object-src 'self'; style-src 'self' 'unsafe-inline'; media-src *");
				meta.setAttribute('http-equiv',"Content-Security-Policy");
				document.head.appendChild(meta);
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
			insertCss: function (rules, doc) {
				if (!doc) { doc = document; }
				new Promise((res, rej) => {
					for (let i = 0; i < doc.styleSheets.length; i++) {
						rules.forEach(rule => {
							try {
								if (typeof (rule) == 'string') doc.styleSheets[i].insertRule(rule, 0);
							} catch(error) {  }
						})
					}
					res();
				});
			},
			export: function (win) {
				if (!win) {
					win = window;
				}
				Object.keys(this).forEach(key => { win[key] = this[key]; });
			},
			Plugins: {},
		}
		Object.freeze(Global);
		class UIElement {
			constructor(tag, id, hidden) {
				let ele = this.Container = this.Element = document.createElement(tag);
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
			/**
			 * 注册启动事件
			 * @param {String} url 启动地址
			 * @param {Function} before 预加载事件
			 * @param {Function} start 主事件
			 * @param {Object|null} context 预置或默认生成的上下文
			 * @returns void
			 */
			on: function (url, before, start, context) {
				if (typeof (url) != "string") { return; }
				if (typeof (before) != "function") { before = () => { }; }
				if (typeof (start) != "function") { start = () => { }; }
				if (!context) { context = {} };
				this.BoostConfigs[url] = { Context: context, OnBefore: before, OnStart: start }
			},
			/**
			 * 注册加载完成的事件
			 * @param {Function} loadEvent 
			 */
			onLoad: function (loadEvent) {
				this.PreloadEvents.push(loadEvent);
			},
			/**
			 * 插件加载完成的事件
			 * @param {Function} loadEvent 
			 */
			onPlugin: function (loadEvent) {
				this.PluginEvents.push(loadEvent);
			},
			/**
			 * 加载完成后的事件
			 * @param {Function} loadEvent 
			 */
			afterLoad: function (loadEvent) {
				this.AfterloadEvents.push(loadEvent);
			}
		}
		Object.freeze(Startup);
		//控件模板
		const Template = {
			/**
			 * 创建一个 ElementPlus 的 el-affix
			 * @param {String} id 控件的id
			 * @param {Number} offset 控件的垂直偏移
			 * @param {String} viewModel 绑定的vm(data:{...})
			 * @param {Function} modify 后处理
			 * @returns 元素
			 */
			Affix: function (id, offset, viewModel, modify) {
				let ret = new UIElement('el-affix', id).Element;
				ret.setAttribute(':offset', offset);
				let button = new UIElement('el-button').Element;
				button.type = "primary";
				button.innerText = "展开";
				button.setAttribute(':style', "{ boxShadow:'let(--el-box-shadow-dark)' }");
				button.setAttribute('v-on:click', '() => ' + viewModel + ' = true');
				button.style = 'padding:20px';
				ret.appendChild(button);
				if (modify) {
					Startup.afterLoad((win, plugins) => {
						modify(win.document.getElementById(id).childNodes[0]);
					})
				}
				return ret;
			},
			/**
			 * 创建一个 ElementPlus 的 el-drawer
			 * @param {String} id 控件的id
			 * @param {Number} width 控件的宽度
			 * @param {String} direction 控件展开方向
			 * @param {String} viewModel 绑定的vm
			 * @param {String} openEventName el-drawer的加载事件名
			 * @returns 元素
			 */
			Drawer: function (id, direction, viewModel, openEventName) {
				let inner = new UIElement('div');
				inner.Element.id = id;
				let ret = new UIElement('el-drawer').Element;
				ret.setAttribute('size', 'auto');
				ret.setAttribute(':with-header', false);
				ret.setAttribute('direction', direction);
				ret.setAttribute('v-model', viewModel);
				ret.setAttribute('v-on:open', '() => ' + openEventName + '()');
				ret.appendChild(inner.Element);
				return ret;
			},
			/**
			 * 快速创建一个接管容器
			 * @param {String} tag 容器标签
			 * @param {Object} victim 被接管的元素
			 * @param {String} mode 接管模式(takeover/grab)
			 * @param {Function} afterCreate 后处理
			 * @returns 元素
			 */
			Wrapper: function (tag, victim, mode, afterCreate) {
				let ret = new UIElement(tag);
				ret.Element.style.width = victim.clientWidth + 'px';
				switch (mode) {
					case 'takeover':
						ret.takeover(victim); break;
					case 'grab':
						ret.grab(victim); break;
				}
				if (afterCreate) {
					afterCreate(ret.Element);
				}
				return ret.Element;
			},
			/**
			 * 从配置的App中创建app
			 * @param {Object} configure Vue配置的App
			 * @param {Object} plugins Global.plugins
			 * @param {Object} mount 挂载在界面上的元素
			 * @param {Function} after 后处理
			 * @returns 创建完的app
			 */
			CreateApp: function (configure, plugins, mount, after) {
				if (!plugins.Vue) return;
				let ret = plugins.Vue.createApp(configure);
				if (plugins.ElementPlus) {
					ret.use(plugins.ElementPlus);
					ret.$message = plugins.ElementPlus.ElMessage;
				}
				if (mount) {
					ret.mount(mount);
				}
				if (after) { after(ret); }
				return ret;
			}
		};
		const LOG = (l) => { console.log(l); };
		const href = window.location.host;

		//TODO:在此开始编写

		//CSDN
		Startup.on("blog.csdn.net",
			(context) => {
				let visual = context.Visual = new UIElement('div', 'Feast-app', true);
				Global.inject(visual.Element);
				Global.loadVue();
				Global.loadElement();
				context.setClickable();
				window.$(window).unbind();
				let main = document.getElementById("mainBox");
				let aside = main.childNodes[5];
				context.Aside = Template.Wrapper('aside', aside, 'grab');
				main.childNodes[3].style.width = "100%";
				let affix = Template.Affix('affix', 120, 'draw', (a) => { a.style.left = '30px'; });
				let drawer = Template.Drawer("drawerContainer", 'ltr', 'draw', 'onOpen');
				visual.add(affix);
				visual.add(drawer);
			},
			(context, win, plugins) => {
				let visual = context.Visual;
				const App = {
					data() {
						return {
							draw: false,
							onOpen: function () {
								Global.takeover(context.Aside, document.getElementById('drawerContainer'));
							},
						};
					},
				};
				const app = Template.CreateApp(App, plugins, visual.Element, () => { visual.show(); });
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
					let hs = document.getElementsByClassName('hljs-button signin');
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
				let link = new URL(window.location.href).searchParams.get('pfurl');
				if (link) {
					window.location.href = link;
				}
			},
			null);

		//腾讯云
		Startup.on("cloud.tencent.com",
			(context) => {
				let visual = context.Visual = new UIElement('div', 'Feast-app', true);
				Global.inject(visual.Element);
				Global.loadVue();
				Global.loadElement();
				let rightSide = document.getElementsByClassName('layout-side')[0];
				let affix = Template.Affix('right-affix', 120, 'RightDraw', (a) => { a.style.right = '100px'; });
				let drawer = Template.Drawer('rightDrawerContainer',  'rtl', 'RightDraw', 'onRightOpen');
				context.RightAside = Template.Wrapper('aside', rightSide, 'takeover');
				visual.add(affix);
				visual.add(drawer);
			},
			(context, win, plugins) => {
				let visual = context.Visual;
				const App = {
					data() {
						return {
							RightDraw: false,
							onRightOpen: function () {
								Global.takeover(context.RightAside, document.getElementById('rightDrawerContainer'));
							},
						};
					},
				};
				let app = Template.CreateApp(App, plugins, visual.Element, () => { visual.show(); });
				if (context.RightAside) {
					app.$message.success("右侧栏收起");
				}
				else {
					app.$message.warning("没有找到捏");
				}
			});

		//StackOverflow
		let StackOverFlowBefore = (context) => {
			let visual = context.Visual = new UIElement('div', 'Feast-app', true);
			Global.inject(visual.Element);
			Global.loadVue();
			Global.loadElement();
			let rightSide = document.getElementById('sidebar');
			document.getElementById('mainbar').style.width = 'calc(100% - let(--su-static24))';
			let affix = Template.Affix('right-affix', 120, 'RightDraw', (a) => { a.style.right = '100px'; });
			let drawer = Template.Drawer('rightDrawerContainer', 'rtl', 'RightDraw', 'onRightOpen');
			context.RightAside = Template.Wrapper('aside', rightSide, 'takeover');
			visual.add(affix);
			visual.add(drawer);
		}
		let StackOverFlowStart = (context, win, plugins) => {
			let visual = context.Visual;
			const App = {
				data() {
					return {
						RightDraw: false,
						onRightOpen: function () {
							let inner = document.getElementById('rightDrawerContainer');
							let drawer = inner.parentElement;
							drawer.style.marginTop = '50px';
							drawer.style.marginBottom = '10px';
							Global.takeover(context.RightAside, inner);
						},
					};
				},
			};
			Template.CreateApp(App, plugins, visual.Element, () => { visual.show(); });
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
				let drawer = Template.Drawer('rightDrawerContainer', 'rtl', 'RightDraw', 'onRightOpen');
				context.RightAside = Template.Wrapper('aside', rightSide, 'takeover');
				document.querySelector('[role=main]').childNodes[0].style.width = '100%'
				visual.add(affix);
				visual.add(drawer);
			},
			(context, win, plugins) => {
				let visual = context.Visual;
				const App = {
					data() {
						return {
							RightDraw: false,
							onRightOpen: function () {
								let inner = document.getElementById('rightDrawerContainer');
								Global.takeover(context.RightAside, inner);
							},
						};
					},
				};
				Template.CreateApp(App, plugins, visual.Element, () => { visual.show(); });
			});

		//码农家园
		Startup.on("www.codenong.com",
			(context) => { document.getElementById('primary').style.width = '100%'; });

		//百度文库
		Startup.on("wenku.baidu.com",
			(context) => {
				let visual = context.Visual = new UIElement('div', 'Feast-app', true);
				Global.inject(visual.Element);
				Global.loadVue();
				Global.loadElement();
				context.Aside = Template.Wrapper('aside', document.getElementById('app-right'), 'takeover');
				let main = document.getElementsByClassName('center-wrapper')[0];
				main.style.width = 'calc(100% - 280px)';
				let affix = Template.Affix('right-affix', 120, 'RightDraw', (a) => { a.style.right = '90px'; });
				let drawer = Template.Drawer("rightDrawerContainer", 'rtl', 'RightDraw', 'onRightOpen');
				visual.add(affix);
				visual.add(drawer);
			},
			(context, win, plugins) => {
				let visual = context.Visual;
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
				const app = Template.CreateApp(App, plugins, visual.Element, () => { visual.show(); });
				if (context.Aside) {
					app.$message.success("右侧栏收起");
				}
				else {
					app.$message.warning("没有找到捏");
				}
			});


		let zhihuContext = {
			closeSign: function () {
				let interval = setInterval(() => {
					let targ = document.getElementsByClassName('Modal-wrapper')[0];
					if (!targ) return;
					clearInterval(interval);
					document.getElementsByClassName('Modal-closeButton')[0].click();
				}, 10);
			},
			closeBottom: function () {
				let interval = setInterval(() => {
					let targ = document.getElementsByClassName('css-1izy64v')[0];
					if (!targ) return;
					clearInterval(interval);
					targ.parentElement.removeChild(targ);
				}, 10);
			}
		};
		//知乎
		Startup.on("www.zhihu.com",
			(context) => {
				let visual = context.Visual = new UIElement('div', 'Feast-app', true);
				Global.inject(visual.Element);
				Global.loadVue();
				Global.loadElement();
				context.closeSign();
				context.closeBottom();
				let aside = document.getElementsByClassName('Question-sideColumn')[0];
				context.Aside = Template.Wrapper('aside', aside , 'takeover');
				let affix = Template.Affix('right-affix', 120, 'RightDraw', (a) => { a.style.right = '90px'; });
				let drawer = Template.Drawer("rightDrawerContainer", 'rtl', 'RightDraw', 'onRightOpen');
				visual.add(affix);
				visual.add(drawer);
				Global.insertCss(['.Question-mainColumn { width:100% }'], document);
			}, 
			(context,win,plugins) => {
				let visual = context.Visual;
				const App = {
					data() {
						return {
							RightDraw: false,
							onRightOpen: function () {
								Global.takeover(context.Aside, document.getElementById('rightDrawerContainer'));
							},
						};
					},
				};
				const app = Template.CreateApp(App, plugins, visual.Element, () => { visual.show(); });
				if (context.Aside) {
					app.$message.success("右侧栏收起");
				}
				else {
					app.$message.warning("没有找到捏");
				}
			}, 
			zhihuContext);
		//知乎专栏
		Startup.on("zhuanlan.zhihu.com",
			(context) => {
				let width = '80%';
				Global.insertCss([
					'.Post-SideActions { right:calc(50vw - 700px) }',
					'.css-78p1r9 { max-width:' + width + ' }',
					'.Post-NormalMain .Post-Header { width:' + width + ' }',
					'.Post-NormalMain>div, .Post-NormalSub>div  { width:' + width + ' }'
				]);
				context.closeSign();
				context.closeBottom();
			}, null, zhihuContext);


		//在以上区域编写
		let config = Startup.BoostConfigs[href];
		window.onload = () => {
			Startup.PluginEvents.forEach(x => { x(window); });
			Startup.PreloadEvents.forEach(x => { x(window, Global.Plugins); });
			config.OnStart(config.Context, window, Global.Plugins);
			Startup.AfterloadEvents.forEach(x => { x(window, Global.Plugins); });
		}
		config.OnBefore(config.Context);
	})();