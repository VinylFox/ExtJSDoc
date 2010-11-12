Ext.BLANK_IMAGE_URL = '/resources/s.gif';

Ext.ns('Ext.app');

Ext.app.SearchField = Ext.extend(Ext.form.TwinTriggerField, {
    initComponent : function(){
        if(!this.store.baseParams){
			this.store.baseParams = {};
		}
		Ext.app.SearchField.superclass.initComponent.call(this);
		this.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                this.onTrigger2Click();
            }
        }, this);
    },

    validationEvent:false,
    validateOnBlur:false,
    trigger1Class:'x-form-clear-trigger',
    trigger2Class:'x-form-search-trigger',
    hideTrigger1:true,
    width:180,
    hasSearch : false,
    paramName : 'query',

    onTrigger1Click : function(){
        if(this.hasSearch){
            this.store.baseParams[this.paramName] = '';
			this.store.removeAll();
			this.el.dom.value = '';
            this.triggers[0].hide();
            this.hasSearch = false;
			this.focus();
        }
    },

    onTrigger2Click : function(){
        var v = this.getRawValue();
        if(v.length < 1){
            this.onTrigger1Click();
            return;
        }
		if(v.length < 2){
			Ext.Msg.alert('Invalid Search', 'You must enter a minimum of 2 characters to search the API');
			return;
		}
		this.store.baseParams[this.paramName] = v;
        var o = {start: 0};
        this.store.reload({params:o});
        this.hasSearch = true;
        this.triggers[0].show();
		this.focus();
    }
});

Ext.app.ApiPanel = Ext.extend(Ext.tree.TreePanel, {
    initComponent: function(){
        this.hiddenPkgs = [];
        Ext.apply(this, {
	        id:'api-tree',
	        region:'west',
	        split:true,
	        width: 280,
	        minSize: 175,
	        maxSize: 500,
	        collapsible: true,
	        margins:'0 0 5 5',
	        cmargins:'0 0 0 0',
	        rootVisible:false,
	        lines:false,
	        autoScroll:true,
	        animCollapse:false,
	        animate: false,
	        collapseMode:'mini',
	        loader: new Ext.tree.TreeLoader({
				preloadChildren: true,
				clearOnLoad: false
			}),
	        root: new Ext.tree.AsyncTreeNode({
	            text:'Ext JS',
	            id:'root',
	            expanded:true,
	            children:[Docs.classData]
	        }),
	        collapseFirst:false,
            tbar:[ ' ',
			new Ext.form.TextField({
				width: 200,
				emptyText:'Find a Class',
                enableKeyEvents: true,
				listeners:{
					render: function(f){
                    	this.filter = new Ext.tree.TreeFilter(this, {
                    		clearBlank: true,
                    		autoClear: true
                    	});
					},
                    keydown: {
                        fn: this.filterTree,
                        buffer: 350,
                        scope: this
                    },
                    scope: this
				}
			}), ' ', ' ',
			{
                iconCls: 'icon-expand-all',
				tooltip: 'Expand All',
                handler: function(){ this.root.expand(true); },
                scope: this
            }, '-', {
                iconCls: 'icon-collapse-all',
                tooltip: 'Collapse All',
                handler: function(){ this.root.collapse(true); },
                scope: this
            }]
        })
        Ext.app.ApiPanel.superclass.initComponent.call(this);
		this.getSelectionModel().on('beforeselect', function(sm, node){
	        return node.isLeaf();
	    });
    },
	filterTree: function(t, e){
		var text = t.getValue();
		Ext.each(this.hiddenPkgs, function(n){
			n.ui.show();
		});
		if(!text){
			this.filter.clear();
			return;
		}
		this.expandAll();
		
		var re = new RegExp('^' + Ext.escapeRe(text), 'i');
		this.filter.filterBy(function(n){
			return !n.attributes.isClass || re.test(n.text);
		});
		
		// hide empty packages that weren't filtered
		this.hiddenPkgs = [];
		this.root.cascade(function(n){
			if(!n.attributes.isClass && n.ui.ctNode.offsetHeight < 3){
				n.ui.hide();
				this.hiddenPkgs.push(n);
			}
		});
	},
    selectClass : function(cls){
        if(cls){
            var parts = cls.split('.');
            var last = parts.length-1;
            var res = [];
            var pkg = [];
            for(var i = 0; i < last; i++){ // things get nasty - static classes can have .
                var p = parts[i];
                var fc = p.charAt(0);
                var staticCls = fc.toUpperCase() == fc;
                if(p == 'Ext' || !staticCls){
                    pkg.push(p);
                    res[i] = 'pkg-'+pkg.join('.');
                }else if(staticCls){
                    --last;
                    res.splice(i, 1);
                }
            }
            res[last] = cls;

            this.selectPath('/root/apidocs/'+res.join('/'));
        }
    }
});


Ext.app.DocPanel = Ext.extend(Ext.Panel, {
    closable: true,
    autoScroll:true,
    
    initComponent : function(){
        var ps = this.cclass.split('.');
        this.title = ps[ps.length-1];
        Ext.apply(this,{
            tbar: ['->',{
                text: 'Properties',
                handler: this.scrollToMember.createDelegate(this, ['props']),
                iconCls: 'icon-prop'
            }, '-',{
                text: 'Methods',
                handler: this.scrollToMember.createDelegate(this, ['methods']),
                iconCls: 'icon-method'
            }, '-',{
                text: 'Events',
                handler: this.scrollToMember.createDelegate(this, ['events']),
                iconCls: 'icon-event'
            }, '-',{
                text: 'Config Options',
                handler: this.scrollToMember.createDelegate(this, ['configs']),
                iconCls: 'icon-config'
            }, '-',{
                text: 'Direct Link',
                handler: this.directLink,
                scope: this,
                iconCls: 'icon-fav'
            }, '-',{
                tooltip:'Hide Inherited Members',
                iconCls: 'icon-hide-inherited',
                enableToggle: true,
                toggleHandler : function(b, pressed){
                     this.body[pressed ? 'addClass' : 'removeClass']('hide-inherited');
                },
                scope: this
            }, '-', {
                tooltip:'Expand All Members',
                iconCls: 'icon-expand-members',
                enableToggle: true,
                toggleHandler : function(b, pressed){
                    this.body[pressed ? 'addClass' : 'removeClass']('full-details');
                },
                scope: this
            }]
        });
        Ext.app.DocPanel.superclass.initComponent.call(this);
    },

    directLink : function(){
        Ext.Msg.prompt('Direct Link', 'The Direct Link', Ext.emptyFn, this, false, document.location.href+'?class='+this.cclass);
    },
    
    scrollToMember : function(member){
        var el = Ext.fly(this.cclass + '-' + member);
        if(el){
            var top = (el.getOffsetsTo(this.body)[1]) + this.body.dom.scrollTop;
            this.body.scrollTo('top', top-25, {duration:0.75, callback: this.hlMember.createDelegate(this, [member])});
        }
    },

	scrollToSection : function(id){
		var el = Ext.getDom(id);
		if(el){
			var top = (Ext.fly(el).getOffsetsTo(this.body)[1]) + this.body.dom.scrollTop;
			this.body.scrollTo('top', top-25, {duration:0.5, callback: function(){
                Ext.fly(el).next('h2').pause(0.2).highlight('#8DB2E3', {attr:'color'});
            }});
        }
	},

    hlMember : function(member){
        var el = Ext.fly(this.cclass + '-' + member);
        if(el){
            if (tr = el.up('tr')) {
                tr.highlight('#cadaf9');
            }
        }
    }
});
Ext.reg('docpanel',Ext.app.DocPanel);

Ext.app.MainPanel = Ext.extend(Ext.TabPanel, {

	initComponent: function(){
		
		this.searchStore = new Ext.data.Store({
	        proxy: new Ext.data.ScriptTagProxy({
	            url: 'http://extjs.com/playpen/api.php'
	        }),
	        reader: new Ext.data.JsonReader({
		            root: 'data'
		        }, 
				['cls', 'member', 'type', 'doc']
			),
			baseParams: {},
	        listeners: {
	            'beforeload' : function(){
	                this.baseParams.qt = Ext.getCmp('search-type').getValue();
	            }
	        }
	    });
		
		Ext.apply(this, {
	        id:'doc-body',
	        region:'center',
	        margins:'0 5 5 0',
	        resizeTabs: true,
	        minTabWidth: 135,
	        tabWidth: 135,
	        plugins: new Ext.ux.TabCloseMenu(),
	        enableTabScroll: true,
	        activeTab: 0,
	
	        items: {
	            id:'welcome-panel',
	            title: 'API Home',
	            autoLoad: {url: 'welcome.html', callback: this.initSearch, scope: this},
	            iconCls:'icon-docs',
	            autoScroll: true,
				tbar: [
					'Search: ', ' ',
	                new Ext.form.ComboBox({
	                    listClass:'x-combo-list-small',
	                    width:90,
	                    value:'Starts with',
	                    id:'search-type',
	                    store: new Ext.data.SimpleStore({
	                        fields: ['text'],
	                        expandData: true,
	                        data : ['Starts with', 'Ends with', 'Any match']
	                    }),
	                    displayField: 'text'
	                }), ' ',
	                new Ext.app.SearchField({
		                width:240,
						store: this.searchStore,
						paramName: 'q'
		            })
	            ]
	        }			
		});
		
		Ext.app.MainPanel.superclass.initComponent.call(this);
	},

    initEvents : function(){
        Ext.app.MainPanel.superclass.initEvents.call(this);
        this.body.on('click', this.onClick, this);
    },

    onClick: function(e, target){
        if(target = e.getTarget('a:not(.exi)', 3)){
            var cls = Ext.fly(target).getAttributeNS('ext', 'cls');
            e.stopEvent();
            if(cls){
                var member = Ext.fly(target).getAttributeNS('ext', 'member');
                this.loadClass(target.href, cls, member);
            }else if(target.className == 'inner-link'){
                this.getActiveTab().scrollToSection(target.href.split('#')[1]);
            }else{
                window.open(target.href);
            }
        }else if(target = e.getTarget('.micon', 2)){
            e.stopEvent();
            var tr = Ext.fly(target.parentNode);
            if(tr.hasClass('expandable')){
                tr.toggleClass('expanded');
            }
        }
    },

    loadClass : function(href, cls, member){
        var id = 'docs-' + cls;
        var tab = this.getComponent(id);
        if(tab){
            this.setActiveTab(tab);
            if(member){
                tab.scrollToMember(member);
            }
        }else{
            var autoLoad = {url: href};
            if(member){
                autoLoad.callback = function(){
                    Ext.getCmp(id).scrollToMember(member);
                }
            }
            var p = this.add(new Ext.app.DocPanel({
                id: id,
                cclass : cls,
                autoLoad: autoLoad,
                iconCls: Docs.icons[cls]
            }));
            this.setActiveTab(p);
        }
    },
	
	initSearch : function(){
		// Custom rendering Template for the View
	    var resultTpl = new Ext.XTemplate(
	        '<tpl for=".">',
	        '<div class="search-item">',
	            '<a class="member" ext:cls="{cls}" ext:member="{member}" href="output/{cls}.html">',
				'<img src="resources/images/default/s.gif" class="item-icon icon-{type}"/>{member}',
				'</a> ',
				'<a class="cls" ext:cls="{cls}" href="output/{cls}.html">{cls}</a>',
	            '<p>{doc}</p>',
	        '</div></tpl>'
	    );
		
		var p = new Ext.DataView({
            applyTo: 'search',
			tpl: resultTpl,
			loadingText:'Searching...',
            store: this.searchStore,
            itemSelector: 'div.search-item',
			emptyText: '<h3>Use the search field above to search the Ext API for classes, properties, config options, methods and events.</h3>'
        });
	},
	
	doSearch : function(e){
		var k = e.getKey();
		if(!e.isSpecialKey()){
			var text = e.target.value;
			if(!text){
				this.searchStore.baseParams.q = '';
				this.searchStore.removeAll();
			}else{
				this.searchStore.baseParams.q = text;
				this.searchStore.reload();
			}
		}
	}
});
Ext.reg('mainpanel',Ext.app.MainPanel);

Ext.onReady(function(){

    Ext.QuickTips.init();

    var api = new Ext.app.ApiPanel();
    var mainPanel = new Ext.app.MainPanel();

    api.on('click', function(node, e){
         if(node.isLeaf()){
            e.stopEvent();
            mainPanel.loadClass(node.attributes.href, node.id);
         }
    });

    mainPanel.on('tabchange', function(tp, tab){
        api.selectClass(tab.cclass); 
    });

    var viewport = new Ext.Viewport({
        layout:'border',
        items:[ {
			id: 'header',
            cls: 'docs-header',
            height: 36,
            region:'north',
            xtype:'box',
            html: '<a href="http://extjs.com" style="float:right;margin-right:10px;"><img src="resources/extjs.gif" style="width:83px;height:24px;margin-top:1px;"/></a><div class="api-title">Ext 3.0 - API Documentation</div>',
            border:false,
            margins: '0 0 5 0'
        }, api, mainPanel ]
    });

    api.expandPath('/root/apidocs');

    // allow for link in
    var page = window.location.href.split('?')[1];
    if(page){
        var ps = Ext.urlDecode(page);
        var cls = ps['class'];
        mainPanel.loadClass('output/' + cls + '.html', cls, ps.member);
    }
    
    viewport.doLayout();
	
	setTimeout(function(){
        Ext.get('loading').remove();
        Ext.get('loading-mask').fadeOut({remove:true});
    }, 550);
	
});